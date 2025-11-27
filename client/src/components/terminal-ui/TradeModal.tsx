// Modified for App Store compliance: price target safe mode - removed all investment predictions

import React from 'react';
import { Trade, Language } from './types';
import { X, Star, CheckCircle2, ChevronDown, Brain, Target, AlertTriangle, FileText, TrendingUp, ShieldCheck, Info } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, TRANSLATIONS } from '@/lib/translations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TradeModalProps {
  trade: Trade;
  onClose: () => void;
  lang: Language;
}

const TradeModal: React.FC<TradeModalProps> = ({ trade, onClose, lang }) => {
  const chartData = Array.from({ length: 10 }).map((_, i) => {
    const base = trade.price * 0.9;
    return {
        name: i,
        price: base + (i * (trade.price * 0.2 / 9))
    }
  });
  
  const t = TRANSLATIONS[lang].modal;
  const tData = TRANSLATIONS[lang].data;
  const sentimentColor = trade.newsAnalysis.positive >= trade.newsAnalysis.negative ? 'text-emerald-500' : 'text-rose-500';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm md:p-4 animate-in fade-in duration-300">
      <style>{`
        @keyframes chart-scan {
            0% { transform: translateX(-100%); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes grid-pulse {
            0% { stroke-opacity: 0.1; }
            50% { stroke-opacity: 0.25; }
            100% { stroke-opacity: 0.1; }
        }
        @keyframes slide-up {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Mobile: h-[100dvh] ensures no cut-off by address bars. Desktop: rounded card. */}
      <div className="w-full h-[100dvh] md:h-auto md:max-h-[95vh] max-w-5xl bg-[#080808] border-0 md:border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden rounded-none md:rounded-sm">
        
        {/* Visible Diagonal Watermark - Centered and Scaled */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 select-none">
             <div className="transform -rotate-12 whitespace-nowrap">
                 <h1 className="text-[12vw] md:text-[8vw] font-black text-white/5 tracking-tighter uppercase leading-none text-center">
                    InsiderPulse<br/>Signal
                 </h1>
             </div>
        </div>

        {/* Top Tech Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-900 to-transparent z-30"></div>
        
        {/* Header Section */}
        <div className="p-4 md:p-6 border-b border-neutral-900 flex justify-between items-start bg-[#0a0a0a] relative z-20 shrink-0">
           <div className="flex gap-4 overflow-hidden">
               {/* Logo Placeholder */}
               <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 font-bold text-xs rounded shadow-inner shrink-0">
                   {trade.ticker.substring(0,2)}
               </div>
               <div className="min-w-0">
                   <div className="flex items-center gap-2 md:gap-3 mb-1">
                       <h2 className="text-xl md:text-2xl font-black text-neutral-200 tracking-tight uppercase truncate">{trade.companyName}</h2>
                       <span className="text-xs font-mono text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 hidden sm:inline-block">{trade.ticker}</span>
                   </div>
                   <div className="flex items-center gap-2">
                        <span className="sm:hidden text-xs font-mono text-neutral-500">{trade.ticker}</span>
                        <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-emerald-500 transition-colors group">
                            <Star size={12} className="group-hover:fill-emerald-500" />
                            <span className="uppercase tracking-wider">Watchlist</span>
                        </button>
                   </div>
               </div>
           </div>
           <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors hover:rotate-90 duration-200 p-1">
               <X size={24} strokeWidth={1} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar bg-transparent">
            
            {/* 1. Main Stats Grid - ORDER: Trade Type | Price | Shares | Total */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-900 bg-[#0c0c0c]/80 backdrop-blur-sm">
                {/* Trade Type */}
                <div className="p-4 md:p-6 border-r border-b md:border-b-0 border-neutral-900">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">{t.tradeType}</div>
                    <div className={`text-xl md:text-2xl font-black uppercase ${trade.type === 'Buy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tData[trade.type] || trade.type}
                    </div>
                </div>
                
                {/* Price per Share */}
                <div className="p-4 md:p-6 border-r-0 md:border-r border-b md:border-b-0 border-neutral-900">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">{t.priceShare}</div>
                    <div className="text-lg md:text-xl font-mono text-neutral-200">${trade.price.toFixed(2)} <span className="text-[10px] md:text-xs text-neutral-600">/ sh</span></div>
                </div>

                {/* Shares Traded */}
                <div className="p-4 md:p-6 border-r border-neutral-900">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">{t.sharesTraded}</div>
                    <div className="text-lg md:text-xl font-mono text-neutral-200">{formatNumber(trade.shares)} <span className="text-[10px] md:text-xs text-neutral-600">vol</span></div>
                </div>

                {/* Total Transaction Amount */}
                <div className="p-4 md:p-6">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">{t.totalValue}</div>
                    <div className="text-lg md:text-xl font-mono text-neutral-200">{formatCurrency(trade.value)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
                
                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-neutral-900">
                    
                    {/* Insider Info Bar */}
                    <div className="p-4 md:p-6 border-b border-neutral-900 flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center bg-neutral-900/20">
                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{t.insiderName}</div>
                            <div className="text-sm font-bold text-neutral-200">{trade.insider}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{t.position}</div>
                            <div className="text-sm font-mono text-neutral-400">{tData[trade.relation] || trade.relation}</div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{t.filingDate}</div>
                            <div className="text-sm font-mono text-neutral-400">{new Date(trade.filingDate).toLocaleDateString()}</div>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-2 bg-emerald-900/10 border border-emerald-900/30 px-3 py-1 rounded text-emerald-500 text-xs font-bold uppercase w-fit">
                            <CheckCircle2 size={12} /> {t.verified}
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="p-4 md:p-6 border-b border-neutral-900">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-600" /> {t.priceAnalysis}
                            </h3>
                            <div className="flex gap-1 md:gap-2">
                                {['1W', '1M', '3M', '1Y'].map(tf => (
                                    <button key={tf} className={`px-2 py-0.5 text-[10px] font-mono ${tf === '1W' ? 'bg-neutral-800 text-white' : 'text-neutral-600 hover:text-neutral-400'}`}>
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-48 md:h-64 w-full bg-[#0a0a0a] border border-neutral-800 relative overflow-hidden group">
                            <div className="absolute top-0 bottom-0 w-[20%] bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent z-10 pointer-events-none animate-[chart-scan_3s_cubic-bezier(0.4,0,0.2,1)_forwards]"></div>

                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" stroke="#171717" vertical={false} className="animate-[grid-pulse_4s_infinite]" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#404040', fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                                    <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fill="url(#colorPrice)" isAnimationActive={true} animationDuration={2500} animationEasing="ease-in-out" />
                                    <ReferenceLine y={trade.price} stroke="#059669" strokeDasharray="3 3" label={{ value: 'ENTRY', fill: '#059669', fontSize: 9, position: 'insideLeft' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-neutral-900/30 border border-neutral-800 p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] text-neutral-600 uppercase">{t.tradePrice}</div>
                                    <div className="text-sm md:text-lg font-mono text-neutral-300">${trade.price.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] text-neutral-600 uppercase">{t.currentPrice}</div>
                                    <div className={`text-sm md:text-lg font-mono ${trade.priceChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${trade.currentPrice.toFixed(2)}</div>
                                </div>
                                <div className={`text-right ${trade.priceChange > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    <div className="text-xs md:text-sm font-bold">{formatPercent(trade.priceChange)}</div>
                                </div>
                            </div>
                            {trade.marketCap && trade.marketCap > 0 && (
                              <div className="bg-neutral-900/30 border border-neutral-800 p-3 col-span-2">
                                <div className="text-[10px] text-neutral-600 uppercase mb-1">{lang === 'ko' ? '시총대비' : 'vs Market Cap'}</div>
                                <div className="text-sm md:text-lg font-mono text-amber-400 font-bold">
                                  {(() => {
                                    const ratio = (trade.value / trade.marketCap) * 100;
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
                                    return ratioStr;
                                  })()}
                                </div>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* News Section */}
                    <div className="p-4 md:p-6">
                        <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-neutral-500" /> {t.relatedNews} ({trade.newsItems.length})
                        </h3>
                        
                        <div className="flex flex-wrap gap-3 md:gap-4 mb-4 text-[10px] font-mono uppercase">
                            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 bg-emerald-900 rounded-full"></span> {trade.newsAnalysis.positive} {lang === 'ko' ? '긍정' : 'Positive'}</span>
                            <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2 h-2 bg-rose-900 rounded-full"></span> {trade.newsAnalysis.negative} {lang === 'ko' ? '부정' : 'Negative'}</span>
                            <span className="flex items-center gap-1.5 text-neutral-500"><span className="w-2 h-2 bg-neutral-800 rounded-full"></span> {trade.newsAnalysis.neutral} {lang === 'ko' ? '중립' : 'Neutral'}</span>
                        </div>

                        <div className="space-y-2">
                            {trade.newsItems.map((news, i) => (
                                <div key={news.id} className="border border-neutral-800 bg-neutral-900/20 p-3 flex justify-between items-center hover:bg-neutral-900/40 transition-colors cursor-pointer group animate-[slide-up_0.3s_ease-out_backwards]" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex-1 pr-2">
                                        <div className="text-xs text-neutral-300 group-hover:text-white transition-colors mb-1 line-clamp-1">{news.title}</div>
                                    </div>
                                    <div className={`shrink-0 text-[9px] px-2 py-0.5 uppercase font-bold rounded border ${
                                        news.sentiment === 'Positive' ? 'border-emerald-900 text-emerald-500 bg-emerald-900/10' :
                                        news.sentiment === 'Negative' ? 'border-rose-900 text-rose-500 bg-rose-900/10' :
                                        'border-neutral-700 text-neutral-500 bg-neutral-800'
                                    }`}>
                                        {news.sentiment}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Analysis */}
                <div className="bg-[#0c0c0c]/90 backdrop-blur-sm">
                    <div className="p-4 md:p-6">
                        <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wide mb-6 flex items-center gap-2">
                            <Brain size={16} className="text-emerald-500" /> {t.aiAnalysis}
                        </h3>

                        <div className="mb-6 flex items-center justify-between bg-neutral-900/30 p-4 rounded border border-neutral-800">
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{t.signal}</div>
                                <div className="text-xl font-black text-emerald-500 uppercase tracking-tight">{tData[trade.type] || trade.type}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{t.confidence}</div>
                                <div className="text-xl font-mono text-white">{trade.aiConfidence}%</div>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed font-mono text-justify border-l-2 border-emerald-900 pl-3 mb-6">
                            {trade.summary}
                        </p>

                        {/* Reference Price Range - App Store Compliance */}
                        <div className="mb-8">
                             <div className="flex items-center gap-2 mb-1">
                                 <Target size={14} className="text-neutral-500" />
                                 <span className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                                   {lang === 'ko' ? '참고 가격대' : lang === 'ja' ? '参考価格帯' : lang === 'zh' ? '参考价格区间' : 'Reference Price Range'}
                                 </span>
                             </div>
                             <div className="text-[8px] text-neutral-600 mb-3">
                               {lang === 'ko' ? '역사적 내부자 거래가' : 'Historical Insider Prices'}
                             </div>
                             <div className="space-y-3">
                                 <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                                     <span className="text-[9px] text-neutral-500 uppercase">
                                       {lang === 'ko' ? '내부자 거래가' : 'Insider Trade Price'}
                                     </span>
                                     <span className="font-mono text-lg text-emerald-400 font-bold">${trade.price.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                                     <span className="text-[9px] text-neutral-500 uppercase">
                                       {lang === 'ko' ? '현재가' : 'Current Price'}
                                     </span>
                                     <div className="flex items-center gap-2">
                                       <span className={`font-mono text-sm ${trade.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                         ${trade.currentPrice.toFixed(2)}
                                       </span>
                                       <span className={`text-[9px] ${trade.priceChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                         {trade.priceChange >= 0 ? '+' : ''}{trade.priceChange.toFixed(1)}%
                                       </span>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-1 pt-2">
                                     <Info size={9} className="text-neutral-600" />
                                     <span className="text-[7px] text-neutral-600">
                                       {lang === 'ko' ? '참고용입니다. 예측 또는 투자 권유가 아닙니다.' : 'For reference only. Not a forecast or investment recommendation.'}
                                     </span>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                                <span className="text-xs text-neutral-500 uppercase">{t.riskLevel}</span>
                                <span className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1">
                                    <AlertTriangle size={10} /> {tData[trade.riskLevel] || trade.riskLevel}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                                <span className="text-xs text-neutral-500 uppercase">{t.timeHorizon}</span>
                                <span className="text-xs font-bold text-neutral-300 uppercase font-mono">{tData[trade.timeHorizon] || trade.timeHorizon}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Spacer for mobile scrolling comfort */}
            <div className="h-12 md:hidden"></div>

            {/* Visible Footer Watermark/Signature (Inside ScrollView for mobile access) */}
            <div className="p-6 border-t border-neutral-900 bg-[#080808] flex flex-col md:flex-row justify-between items-center gap-4 relative z-20 mt-auto mb-6 md:mb-0">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <div className="flex flex-col text-center md:text-left">
                        <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">{t.footerText}</span>
                        <span className="text-[9px] text-neutral-600">InsiderPulse Signal</span>
                    </div>
                </div>
                <div className="text-[9px] text-neutral-600 mono text-center md:text-right">
                    {t.generated}<br/>
                    {new Date().toISOString().split('T')[0]} • SESSION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
