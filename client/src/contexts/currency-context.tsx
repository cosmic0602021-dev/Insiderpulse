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
          // Ensure all rates are valid numbers
          const validRates = {
            USD: Number(result.data.USD) || 1,
            KRW: Number(result.data.KRW) || defaultRates.KRW,
            CNY: Number(result.data.CNY) || defaultRates.CNY,
            JPY: Number(result.data.JPY) || defaultRates.JPY
          };
          setExchangeRates(validRates);
          console.log('💱 Exchange rates updated:', validRates);
        } else {
          console.warn('Invalid exchange rate data, using defaults');
          setExchangeRates(defaultRates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates, using defaults:', error);
        setExchangeRates(defaultRates);
      }
    };

    fetchRates();

    // Refresh rates every 24 hours
    const interval = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert USD amount to selected currency
  const convert = (amountInUSD: number): number => {
    if (!amountInUSD || amountInUSD === 0) return 0;
    const rate = exchangeRates[currency];
    if (!rate || rate === 0) {
      console.warn(`Invalid exchange rate for ${currency}:`, rate);
      return amountInUSD;
    }
    return amountInUSD * rate;
  };

  // Format currency with proper symbol and notation
  const formatCurrency = (amountInUSD: number): string => {
    if (!amountInUSD || amountInUSD === 0) {
      if (currency === 'USD') return '$0';
      if (currency === 'KRW') return '₩0';
      if (currency === 'CNY') return '¥0';
      if (currency === 'JPY') return '¥0';
      return '$0';
    }

    const convertedAmount = convert(amountInUSD);

    const currencySymbols: Record<Currency, string> = {
      USD: '$',
      KRW: '₩',
      CNY: '¥',
      JPY: '¥'
    };

    const symbol = currencySymbols[currency];

    // Use native units for Asian currencies
    if (currency === 'KRW') {
      return formatKoreanWon(convertedAmount);
    } else if (currency === 'CNY') {
      return formatChineseYuan(convertedAmount);
    } else if (currency === 'JPY') {
      return formatJapaneseYen(convertedAmount);
    } else {
      // USD uses compact notation (M, B, T)
      const formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
        minimumFractionDigits: 0
      }).format(convertedAmount);
      return `${symbol}${formatted}`;
    }
  };

  // Format Korean Won with native units (억, 조)
  const formatKoreanWon = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1_000_000_000_000) {
      // 1조 이상
      const jo = absAmount / 1_000_000_000_000;
      if (absAmount >= 10_000_000_000_000) {
        // 10조 이상: 소수점 없이
        return `${sign}₩${Math.round(jo).toLocaleString('ko-KR')}조`;
      }
      return `${sign}₩${jo.toFixed(1)}조`;
    } else if (absAmount >= 100_000_000) {
      // 1억 이상
      const eok = absAmount / 100_000_000;
      if (absAmount >= 1_000_000_000) {
        // 10억 이상: 소수점 없이
        return `${sign}₩${Math.round(eok).toLocaleString('ko-KR')}억`;
      }
      return `${sign}₩${eok.toFixed(1)}억`;
    } else if (absAmount >= 10_000) {
      // 1만 이상
      const man = absAmount / 10_000;
      return `${sign}₩${man.toFixed(0)}만`;
    } else {
      // 1만 미만
      return `${sign}₩${Math.round(absAmount).toLocaleString('ko-KR')}`;
    }
  };

  // Format Chinese Yuan with native units (万, 亿)
  const formatChineseYuan = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 100_000_000) {
      // 1亿 以上
      const yi = absAmount / 100_000_000;
      if (absAmount >= 1_000_000_000) {
        return `${sign}¥${Math.round(yi).toLocaleString('zh-CN')}亿`;
      }
      return `${sign}¥${yi.toFixed(1)}亿`;
    } else if (absAmount >= 10_000) {
      // 1万 以上
      const wan = absAmount / 10_000;
      return `${sign}¥${wan.toFixed(0)}万`;
    } else {
      return `${sign}¥${Math.round(absAmount).toLocaleString('zh-CN')}`;
    }
  };

  // Format Japanese Yen with native units (万, 億, 兆)
  const formatJapaneseYen = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1_000_000_000_000) {
      // 1兆 以上
      const chou = absAmount / 1_000_000_000_000;
      if (absAmount >= 10_000_000_000_000) {
        return `${sign}¥${Math.round(chou).toLocaleString('ja-JP')}兆`;
      }
      return `${sign}¥${chou.toFixed(1)}兆`;
    } else if (absAmount >= 100_000_000) {
      // 1億 以上
      const oku = absAmount / 100_000_000;
      if (absAmount >= 1_000_000_000) {
        return `${sign}¥${Math.round(oku).toLocaleString('ja-JP')}億`;
      }
      return `${sign}¥${oku.toFixed(1)}億`;
    } else if (absAmount >= 10_000) {
      // 1万 以上
      const man = absAmount / 10_000;
      return `${sign}¥${man.toFixed(0)}万`;
    } else {
      return `${sign}¥${Math.round(absAmount).toLocaleString('ja-JP')}`;
    }
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
