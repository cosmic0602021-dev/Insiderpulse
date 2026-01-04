import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

interface TransactionTypeFilterProps {
  value: 'core' | 'all';
  onChange: (value: 'core' | 'all') => void;
}

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-700/50">
          <button
            onClick={() => onChange('core')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              value === 'core'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t('transactionFilter.coreOnly')}
          </button>

          <button
            onClick={() => onChange('all')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              value === 'all'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t('transactionFilter.allTrades')}
          </button>
        </div>

        {/* Help Icon */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
          aria-label={t('transactionFilter.helpModalTitle')}
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t('transactionFilter.helpModalTitle')}</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-neutral-400 pl-4">
                <h4 className="font-semibold text-white mb-1">{t('transactionFilter.coreOnly')}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {t('transactionFilter.coreOnlyDescription')}
                </p>
              </div>

              <div className="border-l-2 border-neutral-600 pl-4">
                <h4 className="font-semibold text-neutral-300 mb-1">{t('transactionFilter.allTrades')}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {t('transactionFilter.allTradesDescription')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-2 rounded transition-colors"
            >
              {t('general.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
