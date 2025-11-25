import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'KRW' | 'CNY' | 'JPY';

interface ExchangeRates {
  USD: number;
  KRW: number;
  CNY: number;
  JPY: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  convert: (amountInUSD: number) => number;
  formatCurrency: (amountInUSD: number) => string;
}

const defaultRates: ExchangeRates = {
  USD: 1,
  KRW: 1473.27,
  CNY: 7.09,
  JPY: 156.98
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      return 'USD';
    }

    try {
      const savedCurrency = localStorage.getItem('currency') as Currency;
      if (savedCurrency && ['USD', 'KRW', 'CNY', 'JPY'].includes(savedCurrency)) {
        console.log('💱 Using saved currency preference:', savedCurrency);
        return savedCurrency;
      }
    } catch (error) {
      console.error('Failed to load saved currency:', error);
    }

    return 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultRates);

  // Save currency preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('currency', currency);
        console.log('💱 Currency preference saved:', currency);
      } catch (error) {
        console.error('Failed to save currency preference:', error);
      }
    }
  }, [currency]);

  // Fetch exchange rates from API
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        const result = await response.json();
        if (result.success && result.data) {
          setExchangeRates(result.data);
          console.log('💱 Exchange rates updated:', result.data);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates, using defaults:', error);
        // Keep using default rates if fetch fails
      }
    };

    fetchRates();

    // Refresh rates every 24 hours
    const interval = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert USD amount to selected currency
  const convert = (amountInUSD: number): number => {
    const rate = exchangeRates[currency];
    return amountInUSD * rate;
  };

  // Format currency with proper symbol and notation
  const formatCurrency = (amountInUSD: number): string => {
    const convertedAmount = convert(amountInUSD);

    const currencySymbols: Record<Currency, string> = {
      USD: '$',
      KRW: '₩',
      CNY: '¥',
      JPY: '¥'
    };

    const currencyConfigs: Record<Currency, { decimals: number; notation: 'compact' | 'standard' }> = {
      USD: { decimals: 1, notation: 'compact' },
      KRW: { decimals: 0, notation: 'compact' },
      CNY: { decimals: 1, notation: 'compact' },
      JPY: { decimals: 0, notation: 'compact' }
    };

    const config = currencyConfigs[currency];
    const symbol = currencySymbols[currency];

    const formatted = new Intl.NumberFormat('en-US', {
      notation: config.notation,
      maximumFractionDigits: config.decimals,
      minimumFractionDigits: 0
    }).format(convertedAmount);

    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRates, convert, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
