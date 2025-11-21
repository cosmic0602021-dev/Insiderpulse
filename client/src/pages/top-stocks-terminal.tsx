import { useQuery } from '@tanstack/react-query';
import TopStocks from '@/components/terminal-ui/TopStocks';
import { useLanguage } from '@/contexts/language-context';
import { useAccess } from '@/contexts/access-context';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { type Language } from '@/lib/translations';
import { TradeDetailModal } from '@/components/trade-detail-modal';
import { useState } from 'react';
import { useLocation } from 'wouter';
import type { InsiderTrade } from '@shared/schema';

interface RankingInsider {
  name: string;
  title: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
  tradeType: string;
}

interface RankingItem {
  ticker: string;
  companyName: string;
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
  enhancedTrade: {
    currentPrice?: number;
    pricePerShare: number;
    priceLastUpdated?: string | null;
  };
  detectedPatterns: any[];
  patternSignals?: string | null;
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
  
  // Fetch ranking data using apiRequest with auth header
  const { data: rankingData, isLoading, error } = useQuery<RankingResponse>({
    queryKey: ['/api/rankings', language],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/rankings?limit=20&language=${language}`);
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
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
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
      currentPrice: currentPrice,
      priceChange: priceChange,
      avgBuyPrice: avgBuyPrice,
      totalBuyAmount: parseNumeric(item.netBuying),
      insiderCount: item.uniqueInsiders || item.insiders?.length || 0,
      lastTradeDate: item.lastTradeDate || new Date().toISOString(),
      buyers: (item.insiders || []).slice(0, 5).map((insider: RankingInsider) => {
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
        };
      }),
    };
  });

  return (
    <>
      <TopStocks
        data={stockRecommendations}
        lang={language as Language}
        isPro={isPro}
        onUpgrade={handleUpgrade}
        onSelectTrade={handleSelectTrade}
      />
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
