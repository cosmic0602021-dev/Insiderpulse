
import React, { useMemo, useState, useEffect } from 'react';
import { StockRecommendation, Language, Trade } from './types';
import { formatNumber, TRANSLATIONS } from '@/lib/translations';
import { useCurrency } from '@/contexts/currency-context';
import { Activity, Lock, ShieldCheck, EyeOff, ScanLine, Eye, PlayCircle } from 'lucide-react';
import { ENV_CONFIG } from '@/lib/environment';
import { PastPerformanceSection } from '@/components/past-performance-section';
import { useRewardedAd } from '@/hooks/use-admob';
import { loadRewardedAd } from '@/lib/admob';

// localStorage 키 상수
const UNLOCKED_STOCKS_KEY = 'insiderpulse_unlocked_stocks';
const RANKINGS_HASH_KEY = 'insiderpulse_rankings_hash';

// 종목 티커 해시 생성 함수
function generateRankingsHash(stocks: StockRecommendation[]): string {
  return stocks.map(s => s.ticker).sort().join(',');
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 총 매수액 자릿수 힌트 (블러 처리용 - 규모만 노출)
function formatMaskedAmount(amount: number): string {
  if (amount >= 10000000) return '$??.?M';
  if (amount >= 1000000) return '$?.??M';
  if (amount >= 100000) return '$???.?K';
  return '$??.?K';
}

// 잠금 카드에 표시할 힌트 생성 (수치 없이 정성적 힌트만)
function getStockHint(stock: StockRecommendation, lang: Language): string {
  const hints = {
    ko: {
      ceo: 'CEO 대량 매수',
      cfo: 'CFO 매수',
      director: '이사진 매수',
      multiple: '내부자 집중 매수',
      large: '대규모 매수',
      default: '임원진 매수',
    },
    en: {
      ceo: 'CEO Major Purchase',
      cfo: 'CFO Buy Activity',
      director: 'Director Purchase',
      multiple: 'Multiple Insiders Buying',
      large: 'Large Purchase',
      default: 'Executive Buy Activity',
    },
    ja: {
      ceo: 'CEO大量購入',
      cfo: 'CFO購入',
      director: '取締役購入',
      multiple: '複数インサイダー購入',
      large: '大規模購入',
      default: '役員購入',
    },
    zh: {
      ceo: 'CEO大量买入',
      cfo: 'CFO买入',
      director: '董事买入',
      multiple: '多位内部人买入',
      large: '大规模买入',
      default: '高管买入',
    },
  };

  const h = hints[lang] || hints.en;
  const firstBuyer = stock.buyers?.[0];
  const relation = firstBuyer?.relation?.toUpperCase() || '';

  if (relation.includes('CEO') || relation.includes('CHIEF EXECUTIVE')) return h.ceo;
  if (relation.includes('CFO') || relation.includes('CHIEF FINANCIAL')) return h.cfo;
  if (relation.includes('DIRECTOR') || relation.includes('CHAIRMAN')) return h.director;
  if (stock.insiderCount >= 3) return h.multiple;
  if (stock.totalBuyAmount > 1000000) return h.large;
  return h.default;
}

interface TopStocksProps {
  data: StockRecommendation[];
  lang: Language;
  isPro: boolean;
  onUpgrade?: () => void;
  onSelectTrade?: (trade: Trade) => void;
  onViewDetails?: (stock: StockRecommendation) => void;
  onPerformanceStockClick?: (ticker: string, stockData: any) => void;
}

const TopStocks: React.FC<TopStocksProps> = ({ data, lang, isPro, onUpgrade, onSelectTrade, onViewDetails, onPerformanceStockClick }) => {
  const { formatCurrency } = useCurrency();
  const t = TRANSLATIONS[lang].top;
  const tData = TRANSLATIONS[lang].data;
  const isAppintos = ENV_CONFIG.isAppintos;
  const { showRewardedAdWithCallback } = useRewardedAd();

  // 앱인토스: 방금 언락된 종목 (플래시 애니메이션용)
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());

  // 앱인토스: 광고 시청 후 잠금 해제된 종목 추적 (localStorage에서 복원)
  const [unlockedStocks, setUnlockedStocks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(UNLOCKED_STOCKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (error) {
      console.warn('[TopStocks] Failed to load unlocked stocks:', error);
    }
    return new Set();
  });

  // 앱인토스: 컴포넌트 마운트 시 보상형 광고 프리로드
  useEffect(() => {
    if (isAppintos) {
      console.log('[TopStocks] Preloading rewarded ad...');
      loadRewardedAd().catch(err => {
        console.warn('[TopStocks] Failed to preload rewarded ad:', err);
      });
    }
  }, [isAppintos]);

  // 앱인토스: unlockedStocks 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isAppintos) return;
    try {
      localStorage.setItem(UNLOCKED_STOCKS_KEY, JSON.stringify([...unlockedStocks]));
    } catch (error) {
      console.warn('[TopStocks] Failed to save unlocked stocks:', error);
    }
  }, [unlockedStocks, isAppintos]);

  // 앱인토스: 종목 갱신 감지 및 잠금 리셋
  useEffect(() => {
    if (!isAppintos || !data || data.length === 0) return;

    const currentHash = generateRankingsHash(data);
    const prevHash = localStorage.getItem(RANKINGS_HASH_KEY);

    if (prevHash && prevHash !== currentHash) {
      // 종목이 갱신됨 - 잠금해제 상태 초기화
      console.log('[TopStocks] Rankings refreshed, resetting unlocked stocks');
      setUnlockedStocks(new Set());
      localStorage.removeItem(UNLOCKED_STOCKS_KEY);
    }

    localStorage.setItem(RANKINGS_HASH_KEY, currentHash);
  }, [data, isAppintos]);

  // Shuffle stocks for Appintos (so users don't just watch ad for #1)
  const shuffledData = useMemo(() => {
    if (!isAppintos) return data;
    return shuffleArray(data);
  }, [data, isAppintos]);

  // Appintos: all 6 locked (shuffled), insiderpulse.pro: only top 3 locked
  const topTier = isAppintos ? shuffledData : data.slice(0, 3);
  const lowerTier = isAppintos ? [] : data.slice(3);

  // Header text: Appintos uses different name
  const headerText = isAppintos
    ? (lang === 'ko' ? '상위 내부자 종목' : 'Top Insider Stocks')
    : t.header;

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
                        {!isAppintos && (
                          <span className={`text-4xl font-black select-none ${stock.rank <= 3 ? 'text-amber-500' : 'text-neutral-800'}`}>0{stock.rank}</span>
                        )}
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
    <div className="flex flex-col bg-[#050505] relative">
      <div className="px-4 py-4 border-b border-neutral-800 bg-[#050505] z-10 relative overflow-hidden">
        {/* 배경 미묘한 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/10 to-transparent pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* 수직 액센트 바 */}
            <div className="w-[3px] self-stretch bg-emerald-500 shrink-0 mt-0.5" />

            <div>
              {/* 상단 라벨 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-[0.2em]">
                  INSIDER PULSE TERMINAL
                </span>
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-600">
                  <span className="animate-pulse">●</span>
                  {lang === 'ko' ? '실시간 연결' : 'LIVE'}
                </span>
              </div>

              {/* 메인 타이틀 */}
              <h1 className="text-2xl font-black font-mono text-neutral-100 tracking-tight uppercase leading-none">
                {headerText}
              </h1>

              {/* 서브헤더 */}
              <p className="text-[11px] text-neutral-300 mt-1.5 font-mono flex items-center gap-2 leading-relaxed">
                <Activity size={11} className="text-emerald-600 shrink-0" />
                {t.subHeader}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Past Performance Section - 헤더 바로 아래 */}
      <div className="px-3 sm:px-6 pt-4">
        <PastPerformanceSection onStockClick={onPerformanceStockClick} />
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-6 relative">

          {/* TOP TIER (Restricted for OUTSIDER) - Ranks 1-3 (or all 6 for Appintos) */}
          <div className="relative mb-4">
             {!isPro ? (
               isAppintos ? (
                 /* Appintos: Individual locked cards with ad unlock */
                 <div className="grid gap-2">
                   {topTier.map((stock, idx) => (
                     unlockedStocks.has(stock.ticker) ? (
                       /* 잠금 해제된 카드 - 언락 플래시 애니메이션 포함 */
                       <div
                         key={stock.ticker}
                         style={justUnlocked.has(stock.ticker) ? {
                           outline: '1px solid rgba(16,185,129,0.6)',
                           boxShadow: '0 0 16px rgba(16,185,129,0.25)',
                           transition: 'all 0.7s ease'
                         } : { transition: 'all 0.7s ease' }}
                       >
                         <StockCard stock={stock} />
                       </div>
                     ) : (
                       /* 잠긴 카드 - 리디자인: 총액 힌트 + CTA 크기 키움 */
                       <button
                         key={stock.ticker}
                         onClick={() => {
                           showRewardedAdWithCallback(
                             // 성공: 광고 끝까지 시청 → 잠금 해제 + 플래시 피드백
                             () => {
                               setUnlockedStocks(prev => new Set([...prev, stock.ticker]));
                               setJustUnlocked(prev => new Set([...prev, stock.ticker]));
                               setTimeout(() => {
                                 setJustUnlocked(prev => {
                                   const next = new Set(prev);
                                   next.delete(stock.ticker);
                                   return next;
                                 });
                               }, 2000);
                               if (onViewDetails) {
                                 setTimeout(() => onViewDetails(stock), 200);
                               }
                             },
                             // 취소: 광고 중간에 닫음 → 잠금 유지
                             () => {
                               console.log('[TopStocks] Ad cancelled, stock remains locked');
                             }
                           );
                         }}
                         className="w-full text-left group relative overflow-hidden"
                       >
                         {/* 좌측 액센트 라인 */}
                         <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-700/50 group-hover:bg-emerald-500/80 transition-colors" />

                         <div className="bg-[#0d0d0d] border border-neutral-800/80 group-hover:border-emerald-800/40 ml-[3px] transition-all">
                           {/* 헤더: 블러 티커 + 배지 */}
                           <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                             <div className="flex items-center gap-2.5">
                               <span className="text-base font-bold text-neutral-300 blur-sm select-none font-mono tracking-widest">
                                 {stock.ticker}
                               </span>
                               <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 border border-neutral-800 px-1.5 py-0.5">
                                 CLASSIFIED
                               </span>
                             </div>
                             {/* 고액/다수 내부자 카드에만 STRONG 배지 */}
                             {(stock.totalBuyAmount > 500000 || stock.insiderCount >= 2 || idx === 0) && (
                               <span className="text-[8px] font-mono uppercase tracking-widest text-amber-500 border border-amber-900/40 bg-amber-950/20 px-1.5 py-0.5">
                                 {stock.insiderCount >= 3 ? 'CLUSTER' : 'STRONG'}
                               </span>
                             )}
                           </div>

                           {/* 지표 행: 블러 총액 + 내부자수 + 신호 */}
                           <div className="px-4 pb-3 flex items-end gap-5">
                             <div>
                               <p className="text-[8px] text-neutral-600 uppercase tracking-wider mb-1">
                                 {lang === 'ko' ? '총 매수액' : 'TOTAL BUY'}
                               </p>
                               <p className="text-sm font-mono font-bold text-emerald-500 blur-[3px] select-none">
                                 {formatMaskedAmount(stock.totalBuyAmount)}
                               </p>
                             </div>
                             <div>
                               <p className="text-[8px] text-neutral-600 uppercase tracking-wider mb-1">
                                 {lang === 'ko' ? '내부자' : 'INSIDERS'}
                               </p>
                               <p className="text-sm font-mono font-bold text-neutral-300">
                                 {stock.insiderCount}{lang === 'ko' ? '명' : ''}
                               </p>
                             </div>
                             <div>
                               <p className="text-[8px] text-neutral-600 uppercase tracking-wider mb-1">SIGNAL</p>
                               <p className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-wider">
                                 {getStockHint(stock, lang)}
                               </p>
                             </div>
                           </div>

                           {/* CTA 영역 - 크고 명확하게 */}
                           <div className="border-t border-neutral-800/60 px-4 py-3 flex items-center justify-between group-hover:bg-emerald-950/10 transition-colors">
                             <div className="flex items-center gap-2">
                               <PlayCircle size={15} className="text-emerald-600 group-hover:text-emerald-400 transition-colors" />
                               <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 group-hover:text-emerald-300 transition-colors">
                                 {lang === 'ko' ? '광고 시청 후 종목 공개' : 'Watch Ad to Reveal'}
                               </span>
                             </div>
                             <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-widest">
                               {lang === 'ko' ? '무료' : 'FREE'}
                             </span>
                           </div>
                         </div>
                       </button>
                     )
                   ))}
                 </div>
               ) : (
                 /* insiderpulse.pro: Full overlay lock with upgrade CTA */
                 <>
                   {/* Lock Overlay for Top 3 */}
                   <div className="absolute inset-0 z-20 flex items-center justify-center">
                     <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-neutral-800 p-3 text-center shadow-2xl rounded-sm">
                       <div className="flex items-center justify-center gap-2 mb-2">
                         <Lock size={14} className="text-amber-600" />
                         <span className="text-xs font-bold text-neutral-200 uppercase">{t.restricted}</span>
                       </div>
                       <button
                         onClick={onUpgrade}
                         className="w-full py-1.5 px-4 bg-white hover:bg-neutral-200 text-black font-bold uppercase text-[10px] transition-all flex items-center justify-center gap-1"
                       >
                         <ScanLine size={12} />
                         {t.cta}
                       </button>
                     </div>
                   </div>
                   {/* Compact blurred rows */}
                   <div className="flex flex-col gap-1 opacity-25 pointer-events-none select-none filter blur-[3px]">
                     {topTier.map(stock => (
                       <div key={stock.ticker} className="bg-[#0a0a0a] border border-neutral-800 p-2 flex items-center gap-3">
                         <span className="text-lg font-black text-amber-500 w-6">0{stock.rank}</span>
                         <span className="text-sm font-bold text-neutral-200">{stock.ticker}</span>
                         <span className="text-[10px] text-neutral-500 truncate flex-1">{stock.companyName}</span>
                         <span className="text-[10px] text-emerald-500 font-bold">{t.strongBuy}</span>
                       </div>
                     ))}
                   </div>
                 </>
               )
             ) : (
               /* Pro users see full cards */
               <div className="grid gap-4">
                 {topTier.map(stock => <StockCard key={stock.ticker} stock={stock} />)}
               </div>
             )}
          </div>

          {/* LOWER TIER (Always Visible) - Ranks 4+ (Not shown in Appintos) */}
          {lowerTier.length > 0 && (
            <div className="grid gap-4">
                 <div className="flex items-center gap-2 mb-2 px-1">
                     <div className="h-[1px] flex-1 bg-neutral-900"></div>
                     <span className="text-[10px] font-mono text-neutral-600 uppercase">Additional Signals (Public)</span>
                     <div className="h-[1px] flex-1 bg-neutral-900"></div>
                 </div>
                 {lowerTier.map(stock => <StockCard key={stock.ticker} stock={stock} />)}
            </div>
          )}
      </div>
    </div>
  );
};

export default TopStocks;
