import { DollarSign } from 'lucide-react';
import { useCurrency, type Currency } from '@/contexts/currency-context';
import { useState, useRef, useEffect } from 'react';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies: { code: Currency; symbol: string }[] = [
    { code: 'USD', symbol: '$' },
    { code: 'KRW', symbol: '₩' },
    { code: 'CNY', symbol: '¥' },
    { code: 'JPY', symbol: '¥' },
  ];

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
        className="p-2 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors bg-neutral-900/30 flex items-center gap-1.5"
        title="Change currency"
      >
        <DollarSign size={14} />
        <span className="text-xs font-mono font-bold">{currency}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[#0a0a0a] border border-neutral-800 shadow-lg z-50 min-w-[120px]">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-xs font-mono hover:bg-neutral-900 transition-colors flex items-center gap-2 ${
                currency === curr.code ? 'text-emerald-500 bg-neutral-900/50' : 'text-neutral-400'
              }`}
            >
              <span className="text-sm">{curr.symbol}</span>
              <span className="font-bold">{curr.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
