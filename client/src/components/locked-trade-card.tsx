import { Card } from "@/components/ui/card";
import { Lock, TrendingUp, Users } from "lucide-react";
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
          <div className="space-y-2">
            <p className="text-white font-bold text-lg">
              {t('lockedTrade.realtimeInsider')}
            </p>
            <button
              onClick={onUnlock}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105"
            >
              {t('freeZone.unlockButton')}
            </button>
          </div>
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

      {/* Locked cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {trades.slice(0, 3).map((trade) => (
          <LockedTradeCard key={trade.id} trade={trade} onUnlock={onUnlock} />
        ))}
      </div>

      {/* Unlock prompt */}
      <div className="text-center py-6 border-t border-slate-700">
        <p className="text-slate-400 text-sm mb-4">
          {t('lockedTrade.unlockPrompt', { count: trades.length })}
        </p>
        <button
          onClick={onUnlock}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          {t('lockedTrade.startTrial')}
        </button>
      </div>
    </div>
  );
}
