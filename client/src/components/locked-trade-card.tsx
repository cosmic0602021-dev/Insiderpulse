import { Card } from "@/components/ui/card";
import { Lock, TrendingUp, Users, Unlock, ChevronDown, ArrowDown } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import type { InsiderTrade } from "@shared/schema";
import { hasPremiumAccess } from "@/lib/subscription-utils";

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
  const { user } = useAuth();

  if (trades.length === 0) return null;

  // Don't show locked section if user has premium subscription
  if (hasPremiumAccess(user)) {
    console.log('[LOCKED TRADES] User has premium access, hiding locked section');
    return null;
  }

  console.log('[LOCKED TRADES] Showing locked trades section for free user');

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

      {/* Start Trial Button - Only show if user hasn't used trial yet */}
      {user && !user.hasUsedTrial && (
        <div className="relative bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Description */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-300 mb-5">
            {t('lockedTrade.unlockDescription')}
          </p>

          {/* Main Button - Professional */}
          <button
            onClick={onUnlock}
            className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Unlock className="h-5 w-5" />
              <span>{t('lockedTrade.startTrial')}</span>
            </div>
          </button>

          {/* Arrow pointing down */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
              <ArrowDown className="h-3.5 w-3.5" />
              <span>{t('lockedTrade.unlockBelow')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Show premium upgrade button if user has used trial */}
      {user && user.hasUsedTrial && (
        <div className="relative bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-center text-sm text-slate-600 dark:text-slate-300 mb-5">
            {t('lockedTrade.unlockDescription')}
          </p>
          <button
            onClick={onUnlock}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Unlock className="h-5 w-5" />
              <span>Upgrade to Premium</span>
            </div>
          </button>
        </div>
      )}

      {/* Locked cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {trades.slice(0, 3).map((trade) => (
          <LockedTradeCard key={trade.id} trade={trade} onUnlock={onUnlock} />
        ))}
      </div>
    </div>
  );
}
