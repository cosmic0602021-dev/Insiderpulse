import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useLocation } from 'wouter';

interface TrialTimerBannerProps {
  trialExpiresAt: string | Date;
  onUpgrade?: () => void;
}

export function TrialTimerBanner({ trialExpiresAt, onUpgrade }: TrialTimerBannerProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(trialExpiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft(t('trial.expired'));
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialExpiresAt, t]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation('/premium-checkout');
    }
  };

  return (
    <Alert className="border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 animate-pulse" />
          <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
            <span className="font-bold">
              {t('trial.activeNotice')}
            </span>
            {' '}
            <span className="font-mono font-semibold text-base">
              {timeLeft}
            </span>
            {' '}
            {t('trial.remaining')}
          </AlertDescription>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap text-sm shadow-lg"
        >
          {t('trial.upgradeButton')}
        </button>
      </div>
    </Alert>
  );
}

interface TrialExpiredBannerProps {
  onUpgrade?: () => void;
}

export function TrialExpiredBanner({ onUpgrade }: TrialExpiredBannerProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation('/premium-checkout');
    }
  };

  return (
    <Alert className="border-red-500/50 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Clock className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
          <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
            <span className="font-bold">
              {t('trial.expiredNotice')}
            </span>
            {' '}
            {t('trial.upgradePrompt')}
          </AlertDescription>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg"
        >
          {t('trial.subscribeNow')} - $29/mo
        </button>
      </div>
    </Alert>
  );
}
