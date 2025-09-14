import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades } from "@shared/schema";
import { eq, desc, count, sum, avg, sql } from "drizzle-orm";
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
            significanceScore: insertTrade.significanceScore,
            signalType: insertTrade.signalType
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
    
    // Get hot buys (BUY signals with high significance)
    const hotBuysResult = await db
      .select({ count: count() })
      .from(insiderTrades)
      .where(sql`${insiderTrades.signalType} = 'BUY' AND ${insiderTrades.significanceScore} > 80`);
    
    // Get average significance score
    const avgSignificanceResult = await db
      .select({ avg: avg(insiderTrades.significanceScore) })
      .from(insiderTrades);
    
    return {
      todayTrades: todayStats[0]?.count || 0,
      totalVolume: Number(todayStats[0]?.totalVolume) || 0,
      hotBuys: hotBuysResult[0]?.count || 0,
      avgSignificance: Math.round(Number(avgSignificanceResult[0]?.avg) || 0)
    };
  }
}