import { X, ExternalLink, TrendingUp, TrendingDown, Building2, User, Calendar, DollarSign, Percent } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLanguage } from '@/contexts/language-context';
import { useCurrency } from '@/contexts/currency-context';
import { formatNumber } from '@/lib/translations';

interface Trade {
  name: string;
  title: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
  tradeType: string;
  secFilingUrl?: string;
  accessionNumber?: string;
  isInstitution?: boolean;
}

interface TickerTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  companyName: string;
  trades: Trade[];
  currentPrice?: number;
  marketCap: number | null;
  totalNetBuying: number;
}

export function TickerTradesModal({
  isOpen,
  onClose,
  ticker,
  companyName,
  trades,
  currentPrice,
  marketCap,
  totalNetBuying
}: TickerTradesModalProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();

  if (!ticker || !companyName) return null;

  // Calculate aggregate percentage
  const aggregatePercent = marketCap && marketCap > 0
    ? (totalNetBuying / marketCap) * 100
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShares = (shares: number) => {
    if (shares >= 1000000) {
      return `${(shares / 1000000).toFixed(2)}M`;
    } else if (shares >= 1000) {
      return `${(shares / 1000).toFixed(1)}K`;
    }
    return shares.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-[#0a0a0a] border border-neutral-800 p-0">
        <VisuallyHidden>
          <DialogTitle>{companyName} - All Insider Trades</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-neutral-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-100 mb-1">{companyName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-neutral-400">{ticker}</span>
                {currentPrice && (
                  <span className="text-sm text-neutral-500">
                    @ {formatCurrency(currentPrice)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <X size={20} className="text-neutral-400" />
            </button>
          </div>

          {/* Aggregate Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Total Trades</div>
              <div className="text-xl font-bold text-neutral-200">{trades.length}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Net Buying</div>
              <div className="text-xl font-bold text-emerald-500">
                {formatCurrency(totalNetBuying)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">% of Market Cap</div>
              <div className="text-xl font-bold text-amber-500">
                {aggregatePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="overflow-y-auto p-6 space-y-3" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {trades.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No trades found for this ticker</p>
            </div>
          ) : (
            trades.map((trade, index) => {
              const tradePercent = marketCap && marketCap > 0
                ? (trade.totalValue / marketCap) * 100
                : 0;

              return (
                <div
                  key={`${trade.name}-${trade.date}-${index}`}
                  className="p-4 bg-neutral-900/30 border border-neutral-800 rounded-lg hover:bg-neutral-900/50 transition-colors"
                >
                  {/* Trader Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {trade.isInstitution ? (
                          <Building2 size={16} className="text-neutral-500" />
                        ) : (
                          <User size={16} className="text-neutral-500" />
                        )}
                        <h3 className="font-semibold text-neutral-200">{trade.name}</h3>
                      </div>
                      <p className="text-sm text-neutral-500">{trade.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE' ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={16} className="text-rose-500" />
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        trade.tradeType === 'BUY' || trade.tradeType === 'PURCHASE'
                          ? 'bg-emerald-900/30 text-emerald-500'
                          : 'bg-rose-900/30 text-rose-500'
                      }`}>
                        {trade.tradeType}
                      </span>
                    </div>
                  </div>

                  {/* Trade Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <Calendar size={12} />
                        <span>Date</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-300">
                        {formatDate(trade.date)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <DollarSign size={12} />
                        <span>Shares</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-300">
                        {formatShares(trade.shares)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <DollarSign size={12} />
                        <span>Value</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-500">
                        {formatCurrency(trade.totalValue)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <Percent size={12} />
                        <span>of Market Cap</span>
                      </div>
                      <div className="text-sm font-bold text-amber-500">
                        {tradePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* SEC Filing Link */}
                  {trade.secFilingUrl && (
                    <a
                      href={trade.secFilingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>View SEC Filing</span>
                      {trade.accessionNumber && (
                        <span className="text-neutral-600">({trade.accessionNumber.slice(0, 10)}...)</span>
                      )}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
