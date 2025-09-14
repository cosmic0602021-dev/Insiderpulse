import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades } from "@shared/schema";
import { eq, desc, count, sum, avg } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Insider trading data
  getInsiderTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
  getInsiderTradeById(id: string): Promise<InsiderTrade | undefined>;
  createInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade>;
  upsertInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade>;
  updateInsiderTrade(id: string, updates: Partial<InsiderTrade>): Promise<InsiderTrade | undefined>;
  
  // Trading statistics
  getTradingStats(): Promise<TradingStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private insiderTrades: Map<string, InsiderTrade>;

  constructor() {
    this.users = new Map();
    this.insiderTrades = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Insider trading methods
  async getInsiderTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    const trades = Array.from(this.insiderTrades.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(offset, offset + limit);
    return trades;
  }

  async getInsiderTradeById(id: string): Promise<InsiderTrade | undefined> {
    return this.insiderTrades.get(id);
  }

  async createInsiderTrade(insertTrade: InsertInsiderTrade): Promise<InsiderTrade> {
    const id = randomUUID();
    const trade: InsiderTrade = { 
      ...insertTrade, 
      id, 
      ticker: insertTrade.ticker || null,
      aiAnalysis: insertTrade.aiAnalysis || null,
      createdAt: new Date()
    };
    this.insiderTrades.set(id, trade);
    return trade;
  }

  async upsertInsiderTrade(insertTrade: InsertInsiderTrade): Promise<InsiderTrade> {
    // Check if a trade with this accession number already exists
    const existing = Array.from(this.insiderTrades.values()).find(
      trade => trade.accessionNumber === insertTrade.accessionNumber
    );
    
    if (existing) {
      // Update existing trade
      const updatedTrade: InsiderTrade = {
        ...existing,
        ...insertTrade,
        ticker: insertTrade.ticker || null,
        aiAnalysis: insertTrade.aiAnalysis || null,
      };
      this.insiderTrades.set(existing.id, updatedTrade);
      return updatedTrade;
    } else {
      // Create new trade
      return this.createInsiderTrade(insertTrade);
    }
  }

  async updateInsiderTrade(id: string, updates: Partial<InsiderTrade>): Promise<InsiderTrade | undefined> {
    const trade = this.insiderTrades.get(id);
    if (!trade) return undefined;
    
    const updatedTrade = { ...trade, ...updates };
    this.insiderTrades.set(id, updatedTrade);
    return updatedTrade;
  }

  async getTradingStats(): Promise<TradingStats> {
    const trades = Array.from(this.insiderTrades.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt!);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });
    
    const totalVolume = todayTrades.reduce((sum, trade) => sum + trade.totalValue, 0);
    const hotBuys = trades.filter(trade => 
      trade.signalType === 'BUY' && trade.significanceScore > 80
    ).length;
    const avgSignificance = trades.length > 0 
      ? Math.round(trades.reduce((sum, trade) => sum + trade.significanceScore, 0) / trades.length)
      : 0;
    
    return {
      todayTrades: todayTrades.length,
      totalVolume,
      hotBuys,
      avgSignificance
    };
  }
}

import { DatabaseStorage } from "./db-storage";

// Use database storage instead of memory storage for production
export const storage = process.env.NODE_ENV === 'test' ? new MemStorage() : new DatabaseStorage();
