import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/language-context';
import { useCurrency } from '@/contexts/currency-context';
import { resolveApiUrl } from '@/lib/queryClient';
import { formatNumber } from '@/lib/translations';
import { TrendingUp, Users, DollarSign, Activity, CheckCircle, ArrowLeft } from 'lucide-react';

export default function StockLanding() {
  const params = useParams<{ ticker: string }>();
  const [, setLocation] = useLocation();
  const ticker = params.ticker?.toUpperCase();
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Fetch 랭킹 데이터에서 해당 ticker 필터링
  const { data: rankingsData, isLoading } = useQuery({
    queryKey: ['rankings', language, 100],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/rankings?language=${language}&limit=100`));
      if (!response.ok) throw new Error('Failed to fetch rankings');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  const stockData = rankingsData?.rankings?.find((r: any) => r.ticker === ticker);

  // SEO 메타태그
  const metaTitle = stockData
    ? `${ticker} Insider Trading Tracker | ${stockData.companyName} SEC Form 4 Analysis`
    : `${ticker} Insider Trading Tracker | InsiderPulse`;

  const metaDescription = stockData
    ? `Track ${stockData.companyName} (${ticker}) insider trading in real-time. ${stockData.uniqueInsiders} insiders reported ${stockData.totalTrades} trades with $${(stockData.netBuying / 1000000).toFixed(1)}M net buying. SEC Form 4 verified.`
    : `Real-time ${ticker} insider trading tracker. Monitor SEC Form 4 filings and analyze insider buying patterns.`;

  const metaKeywords = stockData
    ? `${ticker} insider trading, ${stockData.companyName} insider buying, ${ticker} SEC Form 4, ${stockData.companyName} stock analysis, insider transactions ${ticker}`
    : `${ticker} insider trading, ${ticker} SEC Form 4, insider buying ${ticker}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-neutral-500">Loading {ticker} data...</div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <>
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
        </Helmet>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl text-neutral-300 mb-4">{ticker} - No Data Available</h1>
            <p className="text-neutral-500 mb-6">This stock is not currently in our top rankings.</p>
            <button
              onClick={() => setLocation('/ranking')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              View All Rankings
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <link rel="canonical" href={`https://insiderpulse.pro/stocks/${ticker}`} />

        {/* Open Graph */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={`https://insiderpulse.pro/stocks/${ticker}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="InsiderPulse" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <div className="min-h-screen bg-[#050505]">
        {/* Header */}
        <div className="border-b border-neutral-800 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => setLocation('/ranking')}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back to Rankings</span>
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-100 mb-2">
                  {stockData.companyName}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-mono text-neutral-400">{ticker}</span>
                  {stockData.currentPrice && (
                    <span className="text-lg text-neutral-500">
                      @ {formatCurrency(stockData.currentPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className={`w-12 h-12 flex items-center justify-center border ${
                stockData.rank <= 3
                  ? 'bg-amber-900/30 border-amber-700 text-amber-500'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400'
              }`}>
                <span className="font-mono text-sm font-bold">#{stockData.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Trades */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-emerald-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Total Trades</span>
              </div>
              <div className="text-3xl font-bold text-neutral-100">{stockData.totalTrades}</div>
            </div>

            {/* Unique Insiders */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-blue-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Insiders</span>
              </div>
              <div className="text-3xl font-bold text-neutral-100">{stockData.uniqueInsiders}</div>
            </div>

            {/* Net Buying */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Net Buying</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                {formatCurrency(stockData.netBuying)}
              </div>
            </div>

            {/* Price Change */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className={stockData.priceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Since Buy</span>
              </div>
              <div className={`text-3xl font-bold ${stockData.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stockData.priceChange >= 0 ? '+' : ''}{stockData.priceChange?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Company Description - SEO 고유 콘텐츠 */}
          <div className="bg-neutral-900/30 border border-neutral-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-neutral-100 mb-4">About {stockData.companyName} Insider Trading</h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              {stockData.companyName} ({ticker})는 SEC Form 4 내부자 거래 추적 대상 기업입니다.
              최근 {stockData.uniqueInsiders}명의 내부자가 {stockData.totalTrades}건의 거래를 보고했으며,
              순매수액은 {formatCurrency(stockData.netBuying)}입니다.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              내부자 거래는 회사 임원, 이사회 멤버 등이 자사 주식을 사고파는 행위로, SEC에 공식 보고 의무가 있습니다.
              특히 집중적인 내부자 매수는 회사의 미래 전망에 대한 긍정적 신호로 해석될 수 있습니다.
            </p>
          </div>

          {/* Insider List */}
          <div className="bg-neutral-900/30 border border-neutral-800 p-6 mb-8">
            <h2 className="text-xl font-bold text-neutral-100 mb-4">Recent Insider Trades</h2>
            <div className="space-y-3">
              {stockData.buyers.slice(0, 5).map((buyer: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-950/30 border border-neutral-800">
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-200">{buyer.name}</div>
                    <div className="text-sm text-neutral-500">{buyer.relation}</div>
                    <div className="text-xs text-neutral-600 font-mono mt-1">{buyer.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      {formatCurrency(buyer.amount)}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {formatNumber(buyer.shares)} shares
                    </div>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-mono">SEC Verified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-emerald-950/50 via-neutral-950 to-neutral-950 border border-emerald-800/60 p-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-100 mb-4">
              Track {ticker} Insider Trading in Real-Time
            </h2>
            <p className="text-neutral-400 mb-6 max-w-2xl mx-auto">
              Get instant alerts when insiders buy or sell {ticker} stock.
              Access comprehensive analysis, AI insights, and SEC filing verification.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setLocation('/ranking')}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
              >
                View Full Rankings
              </button>
              <button
                onClick={() => setLocation('/signup')}
                className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-lg transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-600">
            <p>InsiderPulse - Real-time SEC Form 4 Insider Trading Tracker</p>
            <p className="mt-2">Data sourced from official SEC EDGAR filings</p>
          </div>
        </div>
      </div>
    </>
  );
}
