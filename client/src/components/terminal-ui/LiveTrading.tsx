import { useState, useMemo } from 'react';
import { Trade, Language } from './types';
import { formatNumber, formatPercent, TRANSLATIONS } from '@/lib/translations';
import { useCurrency } from '@/contexts/currency-context';
import { Search, Download, Lock, Clock, Zap, AlertTriangle } from 'lucide-react';

interface LiveTradingProps {
  data: Trade[];
  onSelectTrade: (trade: Trade) => void;
  lang: Language;
  isPro: boolean;
  onUpgrade?: () => void;
}

const LiveTrading: React.FC<LiveTradingProps> = ({ data, onSelectTrade, lang, isPro, onUpgrade }) => {
  const [filter, setFilter] = useState<'All' | 'Buy' | 'Sell'>('All');
  const { formatCurrency } = useCurrency();
  const langKey = lang.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].live;
  const tData = TRANSLATIONS[langKey].data;

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const filteredData = sortedData.filter(t => filter === 'All' || t.type === filter);

  const realTimeItems = filteredData.slice(0, 3);
  const historicalItems = filteredData.slice(3);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
       <style>{`
         @keyframes move-stripes {
           0% { background-position: 0 0; }
           100% { background-position: 28px 0; }
         }
       `}</style>

       <div className="p-6 border-b border-neutral-900">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
               <div>
                   <h1 className="text-3xl font-light text-neutral-200 tracking-tight flex items-center gap-3">
                       {t.header}
                       {!isPro && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/20 text-amber-500 border border-amber-900/30 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] whitespace-nowrap">{t.delayedBadge}</span>}
                   </h1>
                   <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2">
                       {isPro ? (
                           <><Zap size={10} className="text-emerald-500" /> {t.realtime}</>
                       ) : (
                           <><Clock size={10} className="text-amber-600" /> {t.delayed}</>
                       )}
                   </p>
               </div>
               <div className="flex gap-2 self-end">
                   <button className="p-2 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors bg-neutral-900/30">
                       <Download size={14} />
                   </button>
               </div>
           </div>

           <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
               <div className="relative flex-1 w-full md:max-w-md group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-500 transition-colors" size={14} />
                   <input 
                        type="text" 
                        placeholder={t.query} 
                        className="w-full bg-[#0a0a0a] text-xs text-neutral-300 border border-neutral-800 pl-10 pr-4 py-2.5 focus:outline-none focus:border-neutral-600 font-mono placeholder:text-neutral-800 transition-colors"
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
                       >
                           {f.label}
                       </button>
                   ))}
               </div>
           </div>
       </div>

       <div className="flex-1 overflow-y-auto relative custom-scrollbar">
           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 z-0"></div>

           <div className="sticky top-0 bg-[#050505] border-b border-neutral-800 z-30 grid grid-cols-4 md:grid-cols-7 text-[10px] text-neutral-400 uppercase tracking-widest font-mono px-4 py-3">
               <div className="pl-2">{t.table.ticker}</div>
               <div className="hidden md:block">{t.table.insider}</div>
               <div className="hidden md:block">{t.table.relation}</div>
               <div className="text-right">{t.table.action}</div>
               <div className="text-right hidden md:block">{t.table.volume}</div>
               <div className="text-right">{t.table.value}</div>
               <div className="text-right pr-2">{t.table.impact}</div>
           </div>
           
           <div>
                {!isPro && (
                    <div className="relative border-b border-neutral-800 bg-[#080808] overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none animate-[move-stripes_2s_linear_infinite]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #d97706 10px, #d97706 11px)', backgroundSize: '28px 28px' }}></div>
                        
                        <div className="px-4 py-2 bg-amber-900/10 border-b border-amber-900/20 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                    <AlertTriangle size={12} className="animate-pulse" />
                                    {t.realtimeZone}
                                </div>
                                <div className="text-[9px] text-amber-700 font-mono flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
                                    {t.encrypted}
                                </div>
                        </div>

                        {realTimeItems.map((item, idx) => (
                            <div key={`locked-${item.id || idx}`} className="grid grid-cols-4 md:grid-cols-7 px-4 py-4 border-b border-neutral-900/50 relative opacity-60 select-none group">
                                    <div className="col-span-4 md:col-span-7 flex items-center justify-center absolute inset-0 z-10">
                                        <div className="flex items-center gap-2 bg-black/80 px-3 py-1 rounded border border-neutral-800 text-neutral-500 text-xs font-mono group-hover:text-amber-500 group-hover:border-amber-900/50 transition-colors">
                                            <Lock size={10} /> {t.signalEncrypted}
                                        </div>
                                    </div>
                                    <div className="pl-2 blur-[2px] font-mono text-neutral-600 text-[10px] scale-y-110">0x{Math.random().toString(16).substr(2, 4).toUpperCase()}</div>
                                    <div className="hidden md:block blur-[2px] font-mono text-neutral-600 text-[10px] scale-y-110">ANONYMOUS_USR</div>
                                    <div className="hidden md:block blur-[2px] font-mono text-neutral-600 text-[10px] scale-y-110">OFFICER</div>
                                    <div className="text-right blur-[2px] font-mono text-neutral-600 text-[10px]">TYPE_??</div>
                                    <div className="text-right hidden md:block blur-[2px] font-mono text-neutral-600 text-[10px]">00,000</div>
                                    <div className="text-right blur-[2px] font-mono text-neutral-600 text-[10px]">$$,$$$,$$$</div>
                                    <div className="text-right pr-2 blur-[2px] font-mono text-neutral-600 text-[10px]">0.000%</div>
                            </div>
                        ))}
                        
                        <div className="p-4 flex justify-center relative z-20">
                            <button 
                                onClick={onUpgrade}
                                className="bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold uppercase tracking-widest px-6 py-2 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)]"
                            >
                                <Zap size={14} fill="currentColor" />
                                {t.upgradeAction}
                            </button>
                        </div>
                    </div>
                )}

                <div className="relative z-10">
                        {(isPro ? filteredData : historicalItems).map((trade) => (
                        <div
                            key={trade.id}
                            onClick={() => onSelectTrade(trade)}
                            className="grid grid-cols-4 md:grid-cols-7 px-4 py-3 border-b border-neutral-900/50 hover:bg-neutral-900/40 transition-colors cursor-pointer group text-xs text-neutral-300 font-mono items-center"
                        >
                            <div className="pl-2 font-bold text-neutral-200 group-hover:text-white flex flex-col">
                                {trade.ticker}
                                <span className="text-[9px] text-neutral-500 font-sans font-normal mt-0.5 truncate pr-4">{trade.companyName}</span>
                                <span className="md:hidden text-[9px] text-neutral-400 mt-0.5 truncate">{trade.insider}</span>
                            </div>
                            <div className="hidden md:block text-neutral-400 group-hover:text-neutral-300 truncate pr-2">{trade.insider}</div>
                            <div className="hidden md:block text-neutral-400 text-[9px] uppercase">{tData[trade.relation as keyof typeof tData] || trade.relation}</div>
                            <div className="text-right">
                            <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wide border ${trade.type === 'Buy' ? 'border-emerald-800 text-emerald-400 bg-emerald-900/20' : 'border-rose-800 text-rose-400 bg-rose-900/20'}`}>
                                {tData[trade.type as keyof typeof tData] || trade.type}
                            </span>
                            </div>
                            <div className="hidden md:block text-right text-neutral-400">{formatNumber(trade.shares)}</div>
                            <div className="text-right text-neutral-200">{formatCurrency(trade.value)}</div>
                            <div className="text-right pr-2">
                                {trade.marketCap && trade.marketCap > 0 ? (
                                    <span className="text-neutral-300">
                                        {(() => {
                                          const ratio = (trade.value / trade.marketCap) * 100;
                                          if (ratio >= 10) return Math.round(ratio) + '%';
                                          if (ratio >= 1) return ratio.toFixed(1) + '%';
                                          return ratio.toFixed(2) + '%';
                                        })()}
                                    </span>
                                ) : (
                                    <span className="text-neutral-600 text-[9px]">N/A</span>
                                )}
                            </div>
                        </div>
                        ))}
                </div>
           </div>
           
           {filteredData.length === 0 && (
               <div className="flex flex-col items-center justify-center h-40 border-t border-neutral-900">
                   <p className="text-neutral-400 text-xs mono">{t.noRecords}</p>
               </div>
           )}
       </div>
    </div>
  );
};

export default LiveTrading;
