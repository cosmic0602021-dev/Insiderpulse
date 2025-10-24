import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Clock, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useLocation } from 'wouter';

interface TrialExpiringAlertProps {
  hoursLeft: number;
  onDismiss: () => void;
  onUpgrade: () => void;
}

export function TrialExpiringAlert({ hoursLeft, onDismiss, onUpgrade }: TrialExpiringAlertProps) {
  const { t } = useLanguage();

  return (
    <Alert className="border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-orange-600 hover:text-orange-800"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 animate-pulse" />
          <AlertDescription className="text-orange-800 dark:text-orange-300 text-sm">
            <span className="font-bold">
              {t('fomo.trialExpiringSoon', { hours: hoursLeft })}
            </span>
            {' '}
            {t('fomo.upgradeToKeepAccess')}
          </AlertDescription>
        </div>
        <button
          onClick={onUpgrade}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap text-sm shadow-lg"
        >
          {t('fomo.upgradeNow')} $29/mo
        </button>
      </div>
    </Alert>
  );
}

interface MissedGainsAlertProps {
  missedTrades: number;
  totalValue: number;
  onDismiss: () => void;
  onSubscribe: () => void;
}

export function MissedGainsAlert({ missedTrades, totalValue, onDismiss, onSubscribe }: MissedGainsAlertProps) {
  const { t } = useLanguage();

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Alert className="border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-2 flex-1">
          <Clock className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
          <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
            <span className="font-bold">
              {t('fomo.missedGains', { count: missedTrades, value: formatValue(totalValue) })}
            </span>
            {' '}
            {t('fomo.dontMissNext')}
          </AlertDescription>
        </div>
        <button
          onClick={onSubscribe}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg"
        >
          {t('fomo.subscribeNow')} - $29/mo
        </button>
      </div>
    </Alert>
  );
}

interface BigTradeAlertProps {
  companyName: string;
  ticker: string;
  tradeValue: number;
  traderTitle: string;
  onDismiss: () => void;
  onUnlock: () => void;
}

export function BigTradeAlert({ companyName, ticker, tradeValue, traderTitle, onDismiss, onUnlock }: BigTradeAlertProps) {
  const { t } = useLanguage();

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Alert className="border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 relative animate-pulse">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-amber-600 hover:text-amber-800"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-2 flex-1">
          <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
            <span className="font-bold">
              🚨 {t('fomo.bigTradeAlert')}
            </span>
            {' '}
            <span className="font-semibold">
              {traderTitle}
            </span>
            {' '}
            {t('fomo.bought')} {formatValue(tradeValue)} {t('fomo.of')} <span className="font-bold">{ticker}</span>
            {' '}
            {t('fomo.unlockToSee')}
          </AlertDescription>
        </div>
        <button
          onClick={onUnlock}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg"
        >
          {t('fomo.unlockNow')}
        </button>
      </div>
    </Alert>
  );
}

interface FOMOAlertManagerProps {
  trialExpiresAt?: string | null;
  isTrialing: boolean;
  hasTrial: boolean;
  recentLockedTrades: Array<{
    companyName: string;
    ticker: string;
    totalValue: number;
    traderTitle: string;
  }>;
  onUpgrade: () => void;
  onUnlock: () => void;
}

export function FOMOAlertManager({
  trialExpiresAt,
  isTrialing,
  hasTrial,
  recentLockedTrades,
  onUpgrade,
  onUnlock,
}: FOMOAlertManagerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();

  // Calculate hours left in trial
  const hoursLeft = trialExpiresAt
    ? Math.floor((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const handleUpgradeClick = () => {
    setLocation('/premium-checkout');
    if (onUpgrade) onUpgrade();
  };

  // Show trial expiring alert (3 hours before expiry)
  const showTrialExpiring = isTrialing && hoursLeft > 0 && hoursLeft <= 3 && !dismissedAlerts.has('trial-expiring');

  // Show missed gains alert (after trial expired)
  const showMissedGains = hasTrial && !isTrialing && recentLockedTrades.length > 0 && !dismissedAlerts.has('missed-gains');
  const missedValue = recentLockedTrades.reduce((sum, t) => sum + t.totalValue, 0);

  // Show big trade alert (for free users, big trades > $1M)
  const bigTrade = recentLockedTrades.find(t => t.totalValue >= 1000000);
  const showBigTrade = !isTrialing && !hasTrial && bigTrade && !dismissedAlerts.has('big-trade');

  return (
    <div className="space-y-3">
      {showTrialExpiring && (
        <TrialExpiringAlert
          hoursLeft={hoursLeft}
          onDismiss={() => handleDismiss('trial-expiring')}
          onUpgrade={handleUpgradeClick}
        />
      )}

      {showMissedGains && (
        <MissedGainsAlert
          missedTrades={recentLockedTrades.length}
          totalValue={missedValue}
          onDismiss={() => handleDismiss('missed-gains')}
          onSubscribe={handleUpgradeClick}
        />
      )}

      {showBigTrade && bigTrade && (
        <BigTradeAlert
          companyName={bigTrade.companyName}
          ticker={bigTrade.ticker}
          tradeValue={bigTrade.totalValue}
          traderTitle={bigTrade.traderTitle}
          onDismiss={() => handleDismiss('big-trade')}
          onUnlock={onUnlock}
        />
      )}
    </div>
  );
}
