import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/language-context';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface TransactionTypeHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionTypeHelpModal({ open, onOpenChange }: TransactionTypeHelpModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-200">
            {t('transactionFilter.helpModalTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Core Trades Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-neutral-200">
                {t('transactionFilter.coreOnly')}
              </h3>
              <span className="text-xs bg-emerald-900/30 text-emerald-500 px-2 py-1 rounded uppercase font-medium">
                {t('common.coreOnly')}
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed pl-7">
              {t('transactionFilter.coreOnlyDescription')}
            </p>
          </div>

          <div className="border-t border-neutral-800" />

          {/* All Trades Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-neutral-200">
                {t('transactionFilter.allTrades')}
              </h3>
              <span className="text-xs bg-amber-900/30 text-amber-500 px-2 py-1 rounded uppercase font-medium">
                {t('common.advanced')}
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed pl-7">
              {t('transactionFilter.allTradesDescription')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
