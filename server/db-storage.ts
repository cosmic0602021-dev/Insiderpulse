import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats, type StockPrice, type InsertStockPrice } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades, stockPrices } from "@shared/schema";
import { eq, desc, count, sum, avg, sql, inArray } from "drizzle-orm";
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
  async getInsiderTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    const result = await db
      .select()
      .from(insiderTrades)
      .orderBy(desc(insiderTrades.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
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
        aiAnalysis: insertTrade.aiAnalysis || null
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

  async getTradingStats(): Promise<TradingStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's trades count and total volume
    const todayStats = await db
      .select({
        count: count(),
        totalVolume: sum(insiderTrades.totalValue),
      })
      .from(insiderTrades)
      .where(sql`DATE(${insiderTrades.createdAt}) = DATE(${today.toISOString().split('T')[0]})`);
    
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
}