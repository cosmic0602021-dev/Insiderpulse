import axios from 'axios';
import { db } from './db-storage';
import { exchangeRates, type InsertExchangeRate } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export type SupportedCurrency = 'USD' | 'KRW' | 'CNY' | 'JPY';

export class ExchangeRateService {
  private readonly SUPPORTED_CURRENCIES: SupportedCurrency[] = ['KRW', 'CNY', 'JPY'];
  private readonly BASE_CURRENCY: SupportedCurrency = 'USD';
  private readonly FRANKFURTER_API = 'https://api.frankfurter.dev/v1/latest';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private memoryCache: Map<string, { rate: number; timestamp: number }> = new Map();

  /**
   * Fetch latest exchange rates from Frankfurter API and update database
   */
  async updateExchangeRates(): Promise<void> {
    try {
      console.log('💱 Fetching exchange rates from Frankfurter API...');

      const symbols = this.SUPPORTED_CURRENCIES.join(',');
      const response = await axios.get(`${this.FRANKFURTER_API}?base=${this.BASE_CURRENCY}&symbols=${symbols}`, {
        timeout: 10000
      });

      if (!response.data || !response.data.rates) {
        throw new Error('Invalid response from Frankfurter API');
      }

      const rates = response.data.rates;
      console.log('💱 Received rates:', rates);

      // Update database for each currency
      for (const currency of this.SUPPORTED_CURRENCIES) {
        if (rates[currency]) {
          const rateData: InsertExchangeRate = {
            baseCurrency: this.BASE_CURRENCY,
            targetCurrency: currency,
            rate: rates[currency].toString(),
            source: 'frankfurter'
          };

          // Upsert: Insert or update if exists
          await db
            .insert(exchangeRates)
            .values(rateData)
            .onConflictDoUpdate({
              target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
              set: {
                rate: rateData.rate,
                lastUpdated: new Date(),
                source: rateData.source
              }
            });

          // Update memory cache
          this.memoryCache.set(currency, {
            rate: rates[currency],
            timestamp: Date.now()
          });

          console.log(`✅ Updated ${currency}: ${rates[currency]}`);
        }
      }

      console.log('✅ Exchange rates updated successfully');
    } catch (error) {
      console.error('❌ Failed to update exchange rates:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate for a specific currency
   */
  async getExchangeRate(targetCurrency: SupportedCurrency): Promise<number> {
    if (targetCurrency === this.BASE_CURRENCY) {
      return 1; // USD to USD = 1
    }

    // Check memory cache first
    const cached = this.memoryCache.get(targetCurrency);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rate;
    }

    // Fetch from database
    try {
      const result = await db.query.exchangeRates.findFirst({
        where: and(
          eq(exchangeRates.baseCurrency, this.BASE_CURRENCY),
          eq(exchangeRates.targetCurrency, targetCurrency)
        )
      });

      if (result) {
        const rate = parseFloat(result.rate);

        // Update memory cache
        this.memoryCache.set(targetCurrency, {
          rate,
          timestamp: Date.now()
        });

        return rate;
      }

      // If not in DB, fetch from API
      console.log(`⚠️ Rate for ${targetCurrency} not in DB, fetching from API...`);
      await this.updateExchangeRates();

      // Try again from memory cache
      const newCached = this.memoryCache.get(targetCurrency);
      if (newCached) {
        return newCached.rate;
      }

      throw new Error(`Failed to fetch exchange rate for ${targetCurrency}`);
    } catch (error) {
      console.error(`❌ Failed to get exchange rate for ${targetCurrency}:`, error);
      throw error;
    }
  }

  /**
   * Get all current exchange rates
   */
  async getAllExchangeRates(): Promise<Record<SupportedCurrency, number>> {
    const rates: Record<string, number> = {
      [this.BASE_CURRENCY]: 1
    };

    for (const currency of this.SUPPORTED_CURRENCIES) {
      try {
        rates[currency] = await this.getExchangeRate(currency);
      } catch (error) {
        console.error(`Failed to get rate for ${currency}:`, error);
        rates[currency] = 0;
      }
    }

    return rates as Record<SupportedCurrency, number>;
  }

  /**
   * Convert amount from USD to target currency
   */
  async convert(amountInUSD: number, targetCurrency: SupportedCurrency): Promise<number> {
    if (targetCurrency === this.BASE_CURRENCY) {
      return amountInUSD;
    }

    const rate = await this.getExchangeRate(targetCurrency);
    return amountInUSD * rate;
  }

  /**
   * Initialize exchange rates on server start
   */
  async initialize(): Promise<void> {
    try {
      console.log('🌍 Initializing exchange rate service...');

      // Load rates from database to memory cache
      const dbRates = await db.query.exchangeRates.findMany({
        where: eq(exchangeRates.baseCurrency, this.BASE_CURRENCY)
      });

      if (dbRates.length === 0) {
        console.log('📥 No rates in database, fetching from API...');
        await this.updateExchangeRates();
      } else {
        // Load into memory cache
        for (const rateData of dbRates) {
          this.memoryCache.set(rateData.targetCurrency, {
            rate: parseFloat(rateData.rate),
            timestamp: new Date(rateData.lastUpdated).getTime()
          });
        }
        console.log(`✅ Loaded ${dbRates.length} exchange rates from database`);

        // Check if rates are stale (>24 hours old)
        const oldestRate = dbRates.reduce((oldest, rate) => {
          return new Date(rate.lastUpdated) < new Date(oldest.lastUpdated) ? rate : oldest;
        });

        const age = Date.now() - new Date(oldestRate.lastUpdated).getTime();
        if (age > this.CACHE_DURATION) {
          console.log('⏰ Rates are stale, updating from API...');
          await this.updateExchangeRates();
        }
      }

      console.log('✅ Exchange rate service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize exchange rate service:', error);
      // Don't throw - allow server to start even if rates fail to load
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
