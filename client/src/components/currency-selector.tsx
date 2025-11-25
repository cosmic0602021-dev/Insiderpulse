import { DollarSign, ChevronDown } from 'lucide-react';
import { useCurrency, type Currency } from '@/contexts/currency-context';
import { useState, useRef, useEffect } from 'react';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies: { code: Currency; symbol: string; name: string }[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 px-3 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900/50 transition-all bg-neutral-900/30 flex items-center gap-2 rounded group"
        title="Change currency"
      >
        <DollarSign size={14} className="text-neutral-500 group-hover:text-neutral-300" />
        <span className="text-xs font-mono font-bold">{currentCurrency.symbol} {currency}</span>
        <ChevronDown size={12} className={`text-neutral-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[#0a0a0a] border border-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-50 min-w-[160px] rounded">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-mono hover:bg-neutral-900/70 transition-colors flex items-center justify-between gap-3 first:rounded-t last:rounded-b ${
                currency === curr.code ? 'text-emerald-500 bg-neutral-900/50 border-l-2 border-l-emerald-500' : 'text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{curr.symbol}</span>
                <span className="font-bold">{curr.code}</span>
              </div>
              {currency === curr.code && (
                <span className="text-emerald-500 text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
