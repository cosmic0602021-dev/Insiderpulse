import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface FreeZoneBannerProps {
  delayHours: number;
}

export function FreeZoneBanner({ delayHours }: FreeZoneBannerProps) {
  const { t } = useLanguage();

  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
          <span className="font-semibold">{t('freeZone.delayedData')}</span>
          {' '}
          {t('freeZone.description', { hours: delayHours })}
        </AlertDescription>
      </div>
    </Alert>
  );
}

interface UnlockPromptProps {
  onUnlock: () => void;
}

export function UnlockPrompt({ onUnlock }: UnlockPromptProps) {
  const { t } = useLanguage();

  return (
    <Alert className="border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <AlertDescription className="text-slate-100 text-sm">
            <span className="font-semibold">{t('freeZone.realtimeLocked')}</span>
            {' '}
            {t('freeZone.unlockMessage')}
          </AlertDescription>
        </div>
        <button
          onClick={onUnlock}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors whitespace-nowrap text-sm"
        >
          {t('freeZone.unlockButton')}
        </button>
      </div>
    </Alert>
  );
}
