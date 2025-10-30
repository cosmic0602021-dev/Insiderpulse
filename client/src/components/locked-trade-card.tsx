import { Card } from "@/components/ui/card";
import { Lock, TrendingUp, Users, Unlock, ChevronDown, ArrowDown } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { InsiderTrade } from "@shared/schema";

interface LockedTradeCardProps {
  trade: InsiderTrade;
  onUnlock: () => void;
}

export function LockedTradeCard({ trade, onUnlock }: LockedTradeCardProps) {
  const { t } = useLanguage();

  // Extract key info but hide ticker
  const insiderCount = 1; // Would be calculated from grouped trades
  const totalValue = trade.totalValue || (trade.shares * trade.pricePerShare);
  const hasHighRankInsider = trade.traderTitle?.toLowerCase().includes('ceo') ||
                              trade.traderTitle?.toLowerCase().includes('cfo') ||
                              trade.traderTitle?.toLowerCase().includes('president');

  return (
    <Card className="relative overflow-hidden border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/60 z-10 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <Lock className="h-12 w-12 text-amber-500 mx-auto" />
          <p className="text-white font-bold text-lg">
            {t('lockedTrade.realtimeInsider')}
          </p>
        </div>
      </div>

      {/* Blurred content preview */}
      <div className="p-4 space-y-3 blur-[2px]">
        {/* Top row: Company info (ticker hidden) */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-32 h-6 bg-slate-700 rounded animate-pulse" />
              {hasHighRankInsider && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold">{t('lockedTrade.executive')}</span>
                </div>
              )}
            </div>
            <div className="w-48 h-4 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1 text-green-500">
            <TrendingUp className="h-5 w-5" />
            <span className="font-bold">{t('tradeType.buy')}</span>
          </div>
        </div>

        {/* Trade details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
          <div>
            <div className="text-xs text-slate-400">{t('tradeCard.totalValue')}</div>
            <div className="text-lg font-bold text-white">
              ${(totalValue / 1000000).toFixed(1)}M
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('lockedTrade.insiders')}</div>
            <div className="text-lg font-bold text-amber-500">
              {insiderCount}+ {t('lockedTrade.detected')}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface LockedTradesSectionProps {
  trades: InsiderTrade[];
  onUnlock: () => void;
}

export function LockedTradesSection({ trades, onUnlock }: LockedTradesSectionProps) {
  const { t } = useLanguage();

  if (trades.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold">{t('lockedTrade.realtimeZone')}</h3>
        </div>
        <span className="text-sm text-slate-400">
          {trades.length} {t('lockedTrade.lockedTrades')}
        </span>
      </div>

      {/* Start Trial Button - Premium Design */}
      <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-8 border border-slate-700/50">
        {/* Description */}
        <p className="text-center text-base text-slate-300 mb-6 font-medium">
          {t('lockedTrade.unlockDescription')}
        </p>

        {/* Main Button - Enhanced */}
        <button
          onClick={onUnlock}
          className="group w-full relative overflow-hidden px-10 py-5 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:from-emerald-400 hover:via-blue-400 hover:to-indigo-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

          <div className="relative flex items-center justify-center gap-3">
            <Unlock className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>{t('lockedTrade.startTrial')}</span>
          </div>
        </button>

        {/* Arrow pointing down */}
        <div className="flex justify-center mt-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
            <ArrowDown className="h-4 w-4" />
            <span>{t('lockedTrade.unlockBelow')}</span>
          </div>
        </div>
      </div>

      {/* Locked cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {trades.slice(0, 3).map((trade) => (
          <LockedTradeCard key={trade.id} trade={trade} onUnlock={onUnlock} />
        ))}
      </div>
    </div>
  );
}
