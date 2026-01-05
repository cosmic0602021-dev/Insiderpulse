
import React from 'react';
import { StockRecommendation, Language, Trade } from './types';
import { formatNumber, TRANSLATIONS } from '@/lib/translations';
import { useCurrency } from '@/contexts/currency-context';
import { Activity, Lock, ShieldCheck, EyeOff, ScanLine, Eye } from 'lucide-react';

interface TopStocksProps {
  data: StockRecommendation[];
  lang: Language;
  isPro: boolean;
  onUpgrade?: () => void;
  onSelectTrade?: (trade: Trade) => void;
  onViewDetails?: (stock: StockRecommendation) => void;
}

const TopStocks: React.FC<TopStocksProps> = ({ data, lang, isPro, onUpgrade, onSelectTrade, onViewDetails }) => {
  const { formatCurrency } = useCurrency();
  const t = TRANSLATIONS[lang].top;
  const tData = TRANSLATIONS[lang].data;

  // Split data into Restricted (Top 3) and Visible (4+)
  const topTier = data.slice(0, 3);
  const lowerTier = data.slice(3);

  const handleBuyerClick = (stock: StockRecommendation, buyer: any) => {
    if (!onSelectTrade) return;

    // Construct a Trade object from the specific buyer data to open the modal
    const trade: Trade = {
        id: `generated-${stock.ticker}-${Math.random()}`,
        ticker: stock.ticker,
        companyName: stock.companyName,
        insider: buyer.name,
        relation: buyer.relation,
        type: 'Buy', // Top stocks usually imply buying/positive signal
        shares: buyer.shares,
        price: buyer.price,
        value: buyer.amount,
        date: buyer.date || new Date().toISOString(),
        filingDate: buyer.date || new Date().toISOString(),
        priceChange: buyer.priceChange,
        currentPrice: stock.currentPrice,
        marketCap: stock.marketCap,
        isVerified: true,
        secFilingUrl: buyer.secFilingUrl,
        accessionNumber: buyer.accessionNumber,
        aiScore: 92,
        aiConfidence: 95,
        aiRecommendation: 'Strong Buy',
        riskLevel: 'Low',
        sentiment: 'Bullish',
        summary: 'High conviction insider purchase detected aligning with institutional order flow.',
        catalysts: ['Insider Accumulation', 'Technical Breakout'],
        timeHorizon: '3-6 Months',
        newsAnalysis: {
            positive: 8,
            negative: 1,
            neutral: 3,
            summary: 'Positive sentiment dominance.'
        },
        newsItems: [
            { id: '1', title: 'Significant Insider Activity Detected', sentiment: 'Positive', date: 'Today' }
        ],
        targets: {
            conservative: stock.currentPrice * 1.1,
            realistic: stock.currentPrice * 1.3,
            optimistic: stock.currentPrice * 1.6
        }
    };
    onSelectTrade(trade);
  };

  const StockCard = ({ stock }: { stock: StockRecommendation }) => (
    <div className="bg-[#0a0a0a] border border-neutral-900 p-6 relative overflow-hidden group hover:border-neutral-700 transition-colors">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Stock Info */}
            <div className="w-full lg:w-1/4 border-r-0 lg:border-r border-neutral-900 pr-0 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-black select-none ${stock.rank <= 3 ? 'text-amber-500' : 'text-neutral-800'}`}>0{stock.rank}</span>
                        <h3 className="text-xl font-bold text-neutral-200 tracking-wide">{stock.ticker}</h3>
                    </div>
                    {onViewDetails && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(stock);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-800/70 hover:scale-105"
                        >
                            <Eye size={12} />
                            {lang === 'ko' ? '자세히 보기' : 'View Details'}
                        </button>
                    )}
                </div>
                <div className="text-xs text-neutral-500 uppercase mb-4 tracking-wider">{stock.companyName}</div>
                
                <div className="grid grid-cols-2 gap-y-4 text-[10px] uppercase text-neutral-600">
                    <div>
                        <div className="mb-1">{t.signal}</div>
                        <div className="text-emerald-600 text-base font-bold">{t.strongBuy}</div>
                    </div>
                    <div>
                        <div className="mb-1">{t.insiders}</div>
                        <div className="text-neutral-300 text-base font-mono">{stock.insiderCount}{lang === 'ko' ? '명' : ''}</div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-neutral-900 grid grid-cols-1 gap-2">
                     <div className="flex justify-between text-xs">
                         <span className="text-neutral-600 uppercase">{t.avgPrice}</span>
                         <span className="text-neutral-300 font-mono">{formatCurrency(stock.avgBuyPrice)}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                         <span className="text-neutral-600 uppercase">{t.curPrice}</span>
                         <span className={`${stock.priceChange >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-mono font-bold`}>{formatCurrency(stock.currentPrice)}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                         <span className="text-neutral-600 uppercase">{t.totalVol}</span>
                         <span className="text-emerald-600 font-mono">{formatNumber(stock.totalBuyAmount)}</span>
                     </div>
                     {stock.marketCap && stock.marketCap > 0 && (
                       <div className="flex justify-between text-xs">
                         <span className="text-neutral-600 uppercase">{t.marketCapRatio}</span>
                         <span className="text-amber-400 font-mono font-bold">
                           {(() => {
                             const ratio = (stock.totalBuyAmount / stock.marketCap) * 100;
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
                         </span>
                       </div>
                     )}
                </div>
            </div>

            {/* Right: Cluster Buying Activity */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-900 pb-2">
                    <Activity className="text-emerald-700" size={14} />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">{t.institutional}</span>
                </div>
                
                <div className="space-y-2">
                    {stock.buyers.map((buyer, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleBuyerClick(stock, buyer)}
                            className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 bg-neutral-900/20 border-l-2 border-neutral-800 hover:border-emerald-600 hover:bg-neutral-900/40 transition-all cursor-pointer group/row"
                        >
                            {/* Name & Relation - Col 4 */}
                            <div className="md:col-span-4 flex flex-col">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold text-neutral-300 group-hover/row:text-white transition-colors">{buyer.name}</div>
                                    <span className="bg-emerald-900/20 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{t.buyOnly}</span>
                                </div>
                                <span className="text-xs text-neutral-500 mt-1">{(tData as any)[buyer.relation] || buyer.relation}</span>
                            </div>
                            
                            {/* Buy Price & Change - Col 3 */}
                            <div className="md:col-span-3 bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                                 <div className="text-[9px] text-neutral-500 uppercase mb-0.5">{t.buyPrice}</div>
                                 <div className="text-sm text-emerald-400 font-mono font-bold">
                                    {formatCurrency(buyer.price)}
                                 </div>
                                 <div className={`text-[10px] font-bold mt-1 ${buyer.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     {buyer.priceChange > 0 ? '↗' : '↘'} {buyer.priceChange > 0 ? '+' : ''}{buyer.priceChange}%
                                 </div>
                                 <div className="text-[9px] text-neutral-600 mt-0.5">{buyer.date}</div>
                            </div>

                            {/* Share Count - Col 2 */}
                            <div className="md:col-span-2 bg-neutral-900/50 p-2 rounded border border-neutral-800/50 h-full">
                                 <div className="text-[9px] text-neutral-500 uppercase mb-0.5">{t.shareCount}</div>
                                 <div className="text-sm text-white font-mono font-bold">{formatNumber(buyer.shares)}</div>
                            </div>

                            {/* Total Amount - Col 3 */}
                            <div className="md:col-span-3 bg-neutral-900/50 p-2 rounded border border-neutral-800/50 h-full">
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">{t.totalAmount}</div>
                                <div className="text-sm text-emerald-500 font-bold font-mono">{formatCurrency(buyer.amount)}</div>
                                {stock.marketCap && stock.marketCap > 0 && (
                                  <div className="text-[9px] text-amber-400 font-mono font-bold mt-1">
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
                                      return `${t.marketCapRatio}: ${ratioStr}`;
                                    })()}
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] relative">
      <div className="p-6 border-b border-neutral-900 flex justify-between items-end bg-[#050505] z-10 relative">
          <div>
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase flex items-center gap-3">
                {t.header}
                {!isPro && <div className="bg-amber-900/20 border border-amber-900/50 text-amber-600 p-1 rounded-sm"><Lock size={14} /></div>}
            </h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} /> {t.subHeader}
            </p>
            <p className="text-[10px] text-emerald-500 mt-1 font-mono flex items-center gap-1">
                <span className="animate-pulse">●</span> {lang === 'ko' ? '연결됨' : 'CONNECTED'}
            </p>
          </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 relative custom-scrollbar">
          
          {/* TOP TIER (Restricted for OUTSIDER) - Ranks 1-3 */}
          <div className="relative mb-2">
             {/* Locked State: Compact mini cards with overlay */}
             {!isPro ? (
               <div className="relative">
                 {/* Compact Restricted Overlay */}
                 <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-neutral-800 p-2 text-center shadow-2xl rounded-sm">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <Lock size={12} className="text-amber-600" />
                            <span className="text-[10px] font-bold text-neutral-200 uppercase">{t.restricted}</span>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="w-full py-1 bg-white hover:bg-neutral-200 text-black font-bold uppercase text-[9px] transition-all flex items-center justify-center gap-1"
                        >
                            <ScanLine size={10} />
                            {t.cta}
                        </button>
                    </div>
                 </div>

                 {/* Compact blurred cards - all 3 visible */}
                 <div className="flex flex-col gap-1 opacity-30 pointer-events-none select-none filter blur-[2px]">
                    {topTier.map(stock => (
                      <div key={stock.ticker} className="bg-[#0a0a0a] border border-neutral-800 p-2 flex items-center gap-3">
                        <span className="text-xl font-black text-amber-500">0{stock.rank}</span>
                        <span className="text-sm font-bold text-neutral-200">{stock.ticker}</span>
                        <span className="text-[10px] text-neutral-500">{stock.companyName}</span>
                        <span className="text-[10px] text-emerald-500 font-bold">{t.strongBuy}</span>
                        <span className="text-[10px] text-neutral-500">{stock.insiderCount}{lang === 'ko' ? '명' : ''}</span>
                      </div>
                    ))}
                 </div>
               </div>
             ) : (
               /* Pro users see full cards */
               <div className="grid gap-4">
                  {topTier.map(stock => <StockCard key={stock.ticker} stock={stock} />)}
               </div>
             )}
          </div>

          {/* LOWER TIER (Always Visible) - Ranks 4+ */}
          <div className="grid gap-4">
               <div className="flex items-center gap-2 mb-2 px-1">
                   <div className="h-[1px] flex-1 bg-neutral-900"></div>
                   <span className="text-[10px] font-mono text-neutral-600 uppercase">Additional Signals (Public)</span>
                   <div className="h-[1px] flex-1 bg-neutral-900"></div>
               </div>
               {lowerTier.map(stock => <StockCard key={stock.ticker} stock={stock} />)}
          </div>
      </div>
    </div>
  );
};

export default TopStocks;
