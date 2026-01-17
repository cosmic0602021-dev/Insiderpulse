import { useQuery } from '@tanstack/react-query';
import TopStocks from '@/components/terminal-ui/TopStocks';
import { useLanguage } from '@/contexts/language-context';
import { useAccess } from '@/contexts/access-context';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { type Language } from '@/lib/translations';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { StockSummaryModal } from '@/components/stock-summary-modal';
import { useState } from 'react';
import { useLocation } from 'wouter';
import type { InsiderTrade } from '@shared/schema';
import type { StockRecommendation } from '@/components/terminal-ui/types';

interface RankingInsider {
  name: string;
  title: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
  tradeType: string;
  secFilingUrl?: string;
  accessionNumber?: string;
}

interface RankingItem {
  ticker: string;
  companyName: string;
  sector?: string;  // 업종 정보 (Finnhub에서 캐싱)
  score: number;
  recommendation: string;
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  uniqueInsiders: number;
  avgTradeValue: number;
  netBuying: number;
  lastTradeDate: string;
  insiderActivity: string;
  insiders: RankingInsider[];
  currentPrice?: number;
  priceChangePercent?: number;
  priceLastUpdated?: string | null;
  marketCap?: number | null;
  enhancedTrade: {
    currentPrice?: number;
    pricePerShare: number;
    priceLastUpdated?: string | null;
  };
  detectedPatterns: any[];
  patternSignals?: string | null;
  // 🔒 CRITICAL: Must include these fields from ranking API response
  comprehensiveAnalysis?: any;
  hasComprehensiveAnalysis?: boolean;
}

interface RankingResponse {
  rankings: RankingItem[];
}

export default function TopStocksTerminal() {
  const { language } = useLanguage();
  const { accessLevel } = useAccess();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const isPro = accessLevel?.hasRealtimeAccess || false;

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate('/signup');
    } else {
      navigate('/premium-checkout');
    }
  };
  
  const handleSelectTrade = (trade: any) => {
    // Convert the trade object to InsiderTrade format
    const insiderTrade = {
      id: trade.id || `temp-${Date.now()}`,
      ticker: trade.ticker,
      companyName: trade.companyName,
      traderName: trade.insider,
      traderTitle: trade.relation,
      tradeType: trade.type === 'Buy' ? 'BUY' : 'SELL',
      shares: trade.shares,
      pricePerShare: trade.price,
      totalValue: trade.value,
      filedDate: trade.filingDate || trade.date,
      tradeDate: trade.date,
      isVerified: trade.isVerified || true,
      priceVariance: trade.priceChange || 0,
      secFilingUrl: trade.secFilingUrl || null,
      accessionNumber: trade.accessionNumber || null,
      aiAnalysis: {
        signal: trade.aiRecommendation || 'BUY',
        significanceScore: trade.aiConfidence || 95,
        keyInsights: [trade.summary || 'Significant insider activity detected'],
        riskLevel: trade.riskLevel || 'LOW',
      }
    };
    setSelectedTrade(insiderTrade);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };

  const handleViewDetails = (stock: StockRecommendation) => {
    setSelectedStock(stock);
    setIsSummaryModalOpen(true);
  };

  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
    setSelectedStock(null);
  };

  // Fetch ranking data using apiRequest with auth header
  const { data: rankingData, isLoading, error } = useQuery<RankingResponse>({
    queryKey: ['/api/rankings', language],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/rankings?limit=6&language=${language}`);
        return response.json();
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
        return { rankings: [] };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start pt-[15vh] bg-[#050505] gap-5">
        <div className="ecg-loader">
          <svg viewBox="0 0 360 60" style={{ width: '360px' }}>
            {/* 연속 흐르는 복잡한 ECG 파형 (2배 반복) */}
            <path d="M0,30 L20,30 L25,30 L30,28 L35,32 L40,30 L50,30 L55,25 L60,35 L65,20 L70,50 L75,10 L80,45 L85,30 L95,30 L100,28 L105,32 L110,30 L120,30 L125,25 L130,30 L140,30 L145,28 L150,32 L155,30
                   L180,30 L200,30 L205,30 L210,28 L215,32 L220,30 L230,30 L235,25 L240,35 L245,20 L250,50 L255,10 L260,45 L265,30 L275,30 L280,28 L285,32 L290,30 L300,30 L305,25 L310,30 L320,30 L325,28 L330,32 L335,30 L360,30" />
          </svg>
        </div>
        <div className="text-neutral-300 text-sm">
          {['내부자 소식 엿듣는 중...', '월가 찐친한테 연락 중...', 'SEC 공시 뒤지는 중...', '억만장자 포트폴리오 훔쳐보는 중...', '내부자들 뒷담화 듣는 중...', '비밀 정보원 접선 중...', 'CEO 트위터 스토킹 중...'][Math.floor(Math.random() * 7)]}
        </div>
      </div>
    );
  }

  // Helper function to parse numeric values from formatted strings
  const parseNumeric = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas, dollar signs, and other formatting
    const cleaned = String(value).replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Transform ranking data to TopStocks format
  const stockRecommendations = (rankingData?.rankings || []).map((item: RankingItem, index: number) => {
    // Use enhancedTrade.pricePerShare for average buy price (per share, not dollar value)
    // Guard against missing enhancedTrade
    const avgBuyPrice = item.enhancedTrade?.pricePerShare || item.avgTradeValue || 0;
    const currentPrice = item.currentPrice || item.enhancedTrade?.currentPrice || avgBuyPrice;
    const priceChange = item.priceChangePercent !== undefined 
      ? item.priceChangePercent 
      : (avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0);

    return {
      rank: index + 1,
      ticker: item.ticker,
      companyName: item.companyName || item.ticker,
      sector: item.sector || undefined,  // 업종 정보 포함
      currentPrice: currentPrice,
      priceChange: priceChange,
      avgBuyPrice: avgBuyPrice,
      totalBuyAmount: (item as any).totalInsidersNetBuying || parseNumeric(item.netBuying),  // 필터링된 합계 우선
      insiderCount: item.insiders?.length || item.uniqueInsiders || 0,  // 필터링된 배열 우선
      lastTradeDate: item.lastTradeDate || new Date().toISOString(),
      marketCap: item.marketCap ? Number(item.marketCap) : undefined,
      // 🔒 CRITICAL: Must pass comprehensiveAnalysis from ranking data to enable cross-user caching
      // DO NOT remove these fields - they enable instant AI analysis display without API calls
      comprehensiveAnalysis: (item as any).comprehensiveAnalysis || null,
      hasComprehensiveAnalysis: (item as any).hasComprehensiveAnalysis || false,
      buyers: (item.insiders || []).map((insider: RankingInsider) => {
        // Parse shares and totalValue to numbers (handle formatted strings with commas)
        const sharesNum = parseNumeric(insider.shares);
        const totalValueNum = parseNumeric(insider.totalValue);
        const pricePerShareNum = parseNumeric(insider.pricePerShare);
        
        // Calculate individual buyer's price change
        const buyerBuyPrice = pricePerShareNum || avgBuyPrice;
        const buyerPriceChange = buyerBuyPrice > 0 
          ? ((currentPrice - buyerBuyPrice) / buyerBuyPrice) * 100 
          : 0;
        
        // Use totalValue if available, otherwise calculate
        const buyerAmount = totalValueNum > 0 ? totalValueNum : (sharesNum * buyerBuyPrice);

        return {
          name: insider.name || 'Unknown',
          relation: insider.title || 'Insider',
          shares: sharesNum,
          price: buyerBuyPrice,
          amount: buyerAmount,
          priceChange: Math.round(buyerPriceChange * 10) / 10,
          date: insider.date ? new Date(insider.date).toLocaleDateString() : 'N/A',
          secFilingUrl: insider.secFilingUrl,
          accessionNumber: insider.accessionNumber,
          isInstitution: (insider as any).isInstitution || false,
        };
      }),
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#050505]">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Stocks List - includes PastPerformanceSection at bottom */}
        <TopStocks
          data={stockRecommendations}
          lang={language as Language}
          isPro={isPro}
          onUpgrade={handleUpgrade}
          onSelectTrade={handleSelectTrade}
          onViewDetails={handleViewDetails}
        />
      </div>
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      <StockSummaryModal
        stock={selectedStock}
        isOpen={isSummaryModalOpen}
        onClose={handleCloseSummaryModal}
      />
    </div>
  );
}
