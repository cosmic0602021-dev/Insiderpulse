import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats, type StockPrice, type InsertStockPrice, type StockPriceHistory, type InsertStockPriceHistory, type Alert, type InsertAlert } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades, stockPrices, stockPriceHistory, alerts } from "@shared/schema";
import { eq, desc, count, sum, avg, sql, inArray, gte, lte, and } from "drizzle-orm";
import type { IStorage } from "./storage";

const db = drizzle(process.env.DATABASE_URL!);

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Insider trading methods
  async getInsiderTrades(limit = 20, offset = 0, verifiedOnly = false, fromDate?: string, toDate?: string, sortBy: 'createdAt' | 'filedDate' = 'filedDate'): Promise<InsiderTrade[]> {
    const conditions = [];
    
    if (verifiedOnly) {
      conditions.push(eq(insiderTrades.isVerified, true));
    }
    
    // Apply date filtering
    if (fromDate) {
      const sortField = sortBy === 'filedDate' ? insiderTrades.filedDate : insiderTrades.createdAt;
      conditions.push(gte(sortField, new Date(fromDate)));
    }
    
    if (toDate) {
      const sortField = sortBy === 'filedDate' ? insiderTrades.filedDate : insiderTrades.createdAt;
      conditions.push(lte(sortField, new Date(toDate)));
    }
    
    let query = db
      .select()
      .from(insiderTrades);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sort by specified field
    const sortField = sortBy === 'filedDate' ? insiderTrades.filedDate : insiderTrades.createdAt;
    const result = await query
      .orderBy(desc(sortField))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getVerifiedInsiderTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    return this.getInsiderTrades(limit, offset, true);
  }

  async getInsiderTradeById(id: string): Promise<InsiderTrade | undefined> {
    const result = await db.select().from(insiderTrades).where(eq(insiderTrades.id, id)).limit(1);
    return result[0];
  }

  async createInsiderTrade(insertTrade: InsertInsiderTrade): Promise<InsiderTrade> {
    try {
      const result = await db.insert(insiderTrades).values({
        ...insertTrade,
        ticker: insertTrade.ticker || null,
        aiAnalysis: insertTrade.aiAnalysis || null,
        significanceScore: insertTrade.significanceScore || 50,
        signalType: insertTrade.signalType || 'HOLD',
        // Add verification fields with defaults
        isVerified: insertTrade.isVerified || false,
        verificationStatus: insertTrade.verificationStatus || 'PENDING',
        verificationNotes: insertTrade.verificationNotes || null,
        marketPrice: insertTrade.marketPrice || null,
        priceVariance: insertTrade.priceVariance || null,
        secFilingUrl: insertTrade.secFilingUrl || null
      }).returning();
      return result[0];
    } catch (error: any) {
      // If duplicate accessionNumber, return existing record instead of throwing
      if (error?.code === '23505' || error?.constraint === 'insider_trades_accession_number_unique') {
        console.log(`⚠️ Duplicate accession number ${insertTrade.accessionNumber}, fetching existing record`);
        const existing = await db
          .select()
          .from(insiderTrades)
          .where(eq(insiderTrades.accessionNumber, insertTrade.accessionNumber))
          .limit(1);
        
        if (existing[0]) {
          return existing[0];
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async upsertInsiderTrade(insertTrade: InsertInsiderTrade): Promise<InsiderTrade> {
    try {
      // Try to insert first
      return await this.createInsiderTrade(insertTrade);
    } catch (error: any) {
      // If it fails due to duplicate, update the existing record
      if (error?.code === '23505' || error?.constraint === 'insider_trades_accession_number_unique') {
        const result = await db
          .update(insiderTrades)
          .set({
            companyName: insertTrade.companyName,
            ticker: insertTrade.ticker || null,
            shares: insertTrade.shares,
            pricePerShare: insertTrade.pricePerShare,
            totalValue: insertTrade.totalValue,
            filedDate: insertTrade.filedDate,
            aiAnalysis: insertTrade.aiAnalysis || null,
            significanceScore: insertTrade.significanceScore || 50,
            signalType: insertTrade.signalType || 'HOLD',
            // Add verification fields
            isVerified: insertTrade.isVerified || false,
            verificationStatus: insertTrade.verificationStatus || 'PENDING',
            verificationNotes: insertTrade.verificationNotes || null,
            marketPrice: insertTrade.marketPrice || null,
            priceVariance: insertTrade.priceVariance || null,
            secFilingUrl: insertTrade.secFilingUrl || null
          })
          .where(eq(insiderTrades.accessionNumber, insertTrade.accessionNumber))
          .returning();
        
        return result[0];
      }
      throw error;
    }
  }

  async updateInsiderTrade(id: string, updates: Partial<InsiderTrade>): Promise<InsiderTrade | undefined> {
    const result = await db
      .update(insiderTrades)
      .set(updates)
      .where(eq(insiderTrades.id, id))
      .returning();
    return result[0];
  }

  async getTradingStats(verifiedOnly = true): Promise<TradingStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Build conditions array and combine with and() - CRITICAL for accurate filtering
    const conditions = [
      gte(insiderTrades.createdAt, today),
      lte(insiderTrades.createdAt, tomorrow)
    ];
    
    if (verifiedOnly) {
      conditions.push(eq(insiderTrades.isVerified, true));
    }
    
    // Get today's trades count and total volume with properly combined filters
    const todayStats = await db
      .select({
        count: count(),
        totalVolume: sum(insiderTrades.totalValue),
      })
      .from(insiderTrades)
      .where(and(...conditions));
    
    return {
      todayTrades: todayStats[0]?.count || 0,
      totalVolume: Number(todayStats[0]?.totalVolume) || 0
    };
  }

  // Stock price methods
  async getStockPrice(ticker: string): Promise<StockPrice | undefined> {
    const result = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.ticker, ticker.toUpperCase()))
      .limit(1);
    return result[0];
  }

  async upsertStockPrice(price: InsertStockPrice): Promise<StockPrice> {
    try {
      // Try to insert new record
      const result = await db
        .insert(stockPrices)
        .values({
          ...price,
          ticker: price.ticker.toUpperCase(),
        })
        .returning();
      return result[0];
    } catch (error: any) {
      // If unique constraint violation, update existing record
      if (error?.code === '23505' || error?.constraint?.includes('ticker')) {
        const result = await db
          .update(stockPrices)
          .set({
            companyName: price.companyName,
            currentPrice: price.currentPrice,
            change: price.change,
            changePercent: price.changePercent,
            volume: price.volume,
            marketCap: price.marketCap,
            lastUpdated: sql`NOW()`,
          })
          .where(eq(stockPrices.ticker, price.ticker.toUpperCase()))
          .returning();
        return result[0];
      }
      throw error;
    }
  }

  async getStockPrices(tickers: string[]): Promise<StockPrice[]> {
    if (tickers.length === 0) return [];
    
    const upperTickers = tickers.map(t => t.toUpperCase());
    const result = await db
      .select()
      .from(stockPrices)
      .where(inArray(stockPrices.ticker, upperTickers));
    return result;
  }

  // Stock price history methods
  async getStockPriceHistory(ticker: string, fromDate?: string, toDate?: string): Promise<StockPriceHistory[]> {
    const upperTicker = ticker.toUpperCase();
    let query = db
      .select()
      .from(stockPriceHistory)
      .where(eq(stockPriceHistory.ticker, upperTicker))
      .orderBy(desc(stockPriceHistory.date));

    // Apply date filters if provided
    if (fromDate && toDate) {
      const { gte } = await import('drizzle-orm');
      const { lte } = await import('drizzle-orm');
      query = query.where(
        sql`${stockPriceHistory.ticker} = ${upperTicker} AND ${stockPriceHistory.date} >= ${fromDate} AND ${stockPriceHistory.date} <= ${toDate}`
      );
    }

    return query;
  }

  async upsertStockPriceHistory(history: InsertStockPriceHistory): Promise<StockPriceHistory> {
    try {
      // Try to insert new record
      const result = await db
        .insert(stockPriceHistory)
        .values({
          ...history,
          ticker: history.ticker.toUpperCase(),
        })
        .returning();
      return result[0];
    } catch (error: any) {
      // If unique constraint violation (ticker + date), update existing record
      if (error?.code === '23505' || error?.constraint?.includes('ticker_date')) {
        const result = await db
          .update(stockPriceHistory)
          .set({
            open: history.open,
            high: history.high,
            low: history.low,
            close: history.close,
            volume: history.volume,
          })
          .where(
            sql`${stockPriceHistory.ticker} = ${history.ticker.toUpperCase()} AND ${stockPriceHistory.date} = ${history.date}`
          )
          .returning();
        return result[0];
      }
      throw error;
    }
  }

  async getStockPriceHistoryRange(ticker: string, fromDate: string, toDate: string): Promise<StockPriceHistory[]> {
    const upperTicker = ticker.toUpperCase();
    const result = await db
      .select()
      .from(stockPriceHistory)
      .where(
        sql`${stockPriceHistory.ticker} = ${upperTicker} AND ${stockPriceHistory.date} >= ${fromDate} AND ${stockPriceHistory.date} <= ${toDate}`
      )
      .orderBy(stockPriceHistory.date);
    return result;
  }

  // Alert methods for DatabaseStorage
  async getAlerts(userId?: string): Promise<Alert[]> {
    let query = db.select().from(alerts);
    
    if (userId) {
      query = query.where(eq(alerts.userId, userId));
    }
    
    const result = await query.orderBy(desc(alerts.createdAt));
    return result;
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
    return result[0];
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(insertAlert).returning();
    return result[0];
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const result = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return result[0];
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await db.delete(alerts).where(eq(alerts.id, id));
    return result.rowCount > 0;
  }

  async triggerAlert(id: string): Promise<void> {
    await db
      .update(alerts)
      .set({ lastTriggered: sql`NOW()` })
      .where(eq(alerts.id, id));
  }
}