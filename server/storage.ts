import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats, type StockPrice, type InsertStockPrice, type Alert, type InsertAlert } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades, stockPrices, alerts } from "@shared/schema";
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
  
  // Stock price management
  getStockPrice(ticker: string): Promise<StockPrice | undefined>;
  upsertStockPrice(price: InsertStockPrice): Promise<StockPrice>;
  getStockPrices(tickers: string[]): Promise<StockPrice[]>;
  
  // Alert management
  getAlerts(userId?: string): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<boolean>;
  triggerAlert(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private insiderTrades: Map<string, InsiderTrade>;
  private alerts: Map<string, Alert>;

  constructor() {
    this.users = new Map();
    this.insiderTrades = new Map();
    this.alerts = new Map();
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
      significanceScore: insertTrade.significanceScore || 50,
      signalType: insertTrade.signalType || 'HOLD',
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
        significanceScore: insertTrade.significanceScore || 50,
        signalType: insertTrade.signalType || 'HOLD',
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
    
    return {
      todayTrades: todayTrades.length,
      totalVolume
    };
  }

  // Stock price methods (placeholder for MemStorage)
  async getStockPrice(ticker: string): Promise<StockPrice | undefined> {
    // MemStorage doesn't implement stock prices, return undefined
    return undefined;
  }

  async upsertStockPrice(price: InsertStockPrice): Promise<StockPrice> {
    throw new Error('Stock prices not supported in MemStorage');
  }

  async getStockPrices(tickers: string[]): Promise<StockPrice[]> {
    return [];
  }

  // Alert methods for MemStorage
  async getAlerts(userId?: string): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    if (userId) {
      alerts = alerts.filter(alert => alert.userId === userId);
    }
    return alerts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      lastTriggered: null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;

    const updatedAlert = { ...alert, ...updates };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<boolean> {
    return this.alerts.delete(id);
  }

  async triggerAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.lastTriggered = new Date();
      this.alerts.set(id, alert);
    }
  }
}

import { DatabaseStorage } from "./db-storage";

// Use database storage instead of memory storage for production
export const storage = process.env.NODE_ENV === 'test' ? new MemStorage() : new DatabaseStorage();
