import { type User, type InsertUser, type InsiderTrade, type InsertInsiderTrade, type TradingStats, type StockPrice, type InsertStockPrice, type StockPriceHistory, type InsertStockPriceHistory, type Alert, type InsertAlert } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { users, insiderTrades, stockPrices, stockPriceHistory, alerts } from "@shared/schema";
import { eq, desc, count, sum, avg } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Insider trading data with date filtering
  getInsiderTrades(limit?: number, offset?: number, verifiedOnly?: boolean, fromDate?: string, toDate?: string, sortBy?: 'createdAt' | 'filedDate'): Promise<InsiderTrade[]>;
  getVerifiedInsiderTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
  getInsiderTradeById(id: string): Promise<InsiderTrade | undefined>;
  createInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade>;
  upsertInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade>;
  updateInsiderTrade(id: string, updates: Partial<InsiderTrade>): Promise<InsiderTrade | undefined>;
  
  // Trading statistics
  getTradingStats(verifiedOnly?: boolean): Promise<TradingStats>;
  
  // Stock price management
  getStockPrice(ticker: string): Promise<StockPrice | undefined>;
  upsertStockPrice(price: InsertStockPrice): Promise<StockPrice>;
  getStockPrices(tickers: string[]): Promise<StockPrice[]>;
  
  // Stock price history management
  getStockPriceHistory(ticker: string, fromDate?: string, toDate?: string): Promise<StockPriceHistory[]>;
  upsertStockPriceHistory(history: InsertStockPriceHistory): Promise<StockPriceHistory>;
  getStockPriceHistoryRange(ticker: string, fromDate: string, toDate: string): Promise<StockPriceHistory[]>;
  
  // Alert management
  getAlerts(userId?: string): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<boolean>;
  triggerAlert(id: string): Promise<void>;

  // Efficient duplicate checking
  existsByAccessionNumber(accessionNumber: string): Promise<boolean>;
  existsByAccessionNumbers(accessionNumbers: string[]): Promise<Set<string>>;

  // HOT/WARM/COLD Data Layer Management
  getHotTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
  getWarmTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
  getColdTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
  organizeDataLayers(): Promise<{ hot: number, warm: number, cold: number }>;
  getLayeredTrades(limit?: number, offset?: number): Promise<InsiderTrade[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private insiderTrades: Map<string, InsiderTrade>;
  private stockPriceHistory: Map<string, StockPriceHistory>;
  private alerts: Map<string, Alert>;

  constructor() {
    this.users = new Map();
    this.insiderTrades = new Map();
    this.stockPriceHistory = new Map();
    this.alerts = new Map();

    // Add sample insider trading data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleTrades: InsiderTrade[] = [
      {
        id: randomUUID(),
        accessionNumber: "0000320193-24-000010",
        companyName: "Apple Inc.",
        ticker: "AAPL",
        traderName: "Timothy D. Cook",
        traderTitle: "Chief Executive Officer",
        tradeType: "SELL",
        shares: 50000,
        pricePerShare: 185.25,
        totalValue: 9262500,
        filedDate: new Date('2024-01-15'),
        createdAt: new Date(),
        ownershipPercentage: 0.02,
        aiAnalysis: "High-profile CEO sale of substantial position indicates potential portfolio rebalancing.",
        significanceScore: 85,
        signalType: "SELL",
        isVerified: true,
        verificationStatus: "VERIFIED",
        marketPrice: 187.50,
        priceVariance: -1.21
      },
      {
        id: randomUUID(),
        accessionNumber: "0001318605-24-000025",
        companyName: "Tesla, Inc.",
        ticker: "TSLA",
        traderName: "Elon R. Musk",
        traderTitle: "Chief Executive Officer",
        tradeType: "BUY",
        shares: 25000,
        pricePerShare: 248.75,
        totalValue: 6218750,
        filedDate: new Date('2024-01-10'),
        createdAt: new Date(),
        ownershipPercentage: 12.8,
        aiAnalysis: "CEO increasing stake suggests strong confidence in company direction.",
        significanceScore: 92,
        signalType: "BUY",
        isVerified: true,
        verificationStatus: "VERIFIED",
        marketPrice: 252.10,
        priceVariance: 1.35
      },
      {
        id: randomUUID(),
        accessionNumber: "0000789019-24-000118",
        companyName: "Microsoft Corporation",
        ticker: "MSFT",
        traderName: "Satya Nadella",
        traderTitle: "Chief Executive Officer",
        tradeType: "GRANT",
        shares: 15000,
        pricePerShare: 375.50,
        totalValue: 5632500,
        filedDate: new Date('2024-01-12'),
        createdAt: new Date(),
        ownershipPercentage: 0.01,
        aiAnalysis: "Stock grant as part of executive compensation package.",
        significanceScore: 65,
        signalType: "HOLD",
        isVerified: true,
        verificationStatus: "VERIFIED",
        marketPrice: 378.25,
        priceVariance: 0.73
      },
      {
        id: randomUUID(),
        accessionNumber: "0001652044-24-000042",
        companyName: "Alphabet Inc.",
        ticker: "GOOGL",
        traderName: "Sundar Pichai",
        traderTitle: "Chief Executive Officer",
        tradeType: "SELL",
        shares: 8000,
        pricePerShare: 142.65,
        totalValue: 1141200,
        filedDate: new Date('2024-01-08'),
        createdAt: new Date(),
        ownershipPercentage: 0.01,
        aiAnalysis: "Routine quarterly sale as part of 10b5-1 plan.",
        significanceScore: 45,
        signalType: "HOLD",
        isVerified: true,
        verificationStatus: "VERIFIED",
        marketPrice: 145.20,
        priceVariance: 1.79
      },
      {
        id: randomUUID(),
        accessionNumber: "0001018724-24-000089",
        companyName: "Amazon.com, Inc.",
        ticker: "AMZN",
        traderName: "Andrew R. Jassy",
        traderTitle: "Chief Executive Officer",
        tradeType: "BUY",
        shares: 12000,
        pricePerShare: 155.80,
        totalValue: 1869600,
        filedDate: new Date('2024-01-05'),
        createdAt: new Date(),
        ownershipPercentage: 0.01,
        aiAnalysis: "CEO purchasing additional shares demonstrates confidence in AWS growth strategy.",
        significanceScore: 78,
        signalType: "BUY",
        isVerified: true,
        verificationStatus: "VERIFIED",
        marketPrice: 158.90,
        priceVariance: 1.99
      }
    ];

    sampleTrades.forEach(trade => {
      this.insiderTrades.set(trade.id, trade);
    });

    console.log(`📊 Initialized ${sampleTrades.length} sample insider trades`);
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
  async getInsiderTrades(limit = 20, offset = 0, verifiedOnly = false, fromDate?: string, toDate?: string, sortBy: 'createdAt' | 'filedDate' = 'filedDate'): Promise<InsiderTrade[]> {
    let trades = Array.from(this.insiderTrades.values());
    
    // Filter out HOLD trades completely
    trades = trades.filter(trade => trade.signalType !== 'HOLD');
    
    if (verifiedOnly) {
      trades = trades.filter(trade => trade.isVerified === true);
    }
    
    // Apply date filtering
    if (fromDate || toDate) {
      trades = trades.filter(trade => {
        const compareDate = new Date(sortBy === 'filedDate' ? trade.filedDate : trade.createdAt!);
        const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
        const to = toDate ? new Date(toDate) : new Date('2100-12-31');
        return compareDate >= from && compareDate <= to;
      });
    }
    
    // Sort by specified field
    return trades
      .sort((a, b) => {
        const dateA = new Date(sortBy === 'filedDate' ? a.filedDate : a.createdAt!);
        const dateB = new Date(sortBy === 'filedDate' ? b.filedDate : b.createdAt!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(offset, offset + limit);
  }

  async getVerifiedInsiderTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    return this.getInsiderTrades(limit, offset, true);
  }

  async getInsiderTradeById(id: string): Promise<InsiderTrade | undefined> {
    return this.insiderTrades.get(id);
  }

  async createInsiderTrade(insertTrade: InsertInsiderTrade): Promise<InsiderTrade> {
    const id = randomUUID();
    const trade: InsiderTrade = { 
      ...insertTrade, 
      id, 
      traderName: insertTrade.traderName || 'Unknown Trader',
      traderTitle: insertTrade.traderTitle || null,
      tradeType: insertTrade.tradeType || 'BUY',
      transactionCode: insertTrade.transactionCode || null,
      ticker: insertTrade.ticker || null,
      aiAnalysis: insertTrade.aiAnalysis || null,
      significanceScore: insertTrade.significanceScore || 50,
      signalType: insertTrade.signalType || 'BUY',
      // Add verification fields with defaults
      isVerified: insertTrade.isVerified ?? false,
      verificationStatus: insertTrade.verificationStatus || 'PENDING',
      verificationNotes: insertTrade.verificationNotes || null,
      marketPrice: insertTrade.marketPrice || null,
      priceVariance: insertTrade.priceVariance || null,
      secFilingUrl: insertTrade.secFilingUrl || null,
      ownershipPercentage: insertTrade.ownershipPercentage ?? null,
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
        signalType: insertTrade.signalType || 'BUY',
        ownershipPercentage: insertTrade.ownershipPercentage ?? null,
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

  async getTradingStats(verifiedOnly = true): Promise<TradingStats> {
    let trades = Array.from(this.insiderTrades.values());
    
    // Filter out HOLD trades completely
    trades = trades.filter(trade => trade.signalType !== 'HOLD');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt!);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });
    
    if (verifiedOnly) {
      todayTrades = todayTrades.filter(trade => trade.isVerified === true);
    }
    
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

  // Stock price history methods (memory storage)
  async getStockPriceHistory(ticker: string, fromDate?: string, toDate?: string): Promise<StockPriceHistory[]> {
    const upperTicker = ticker.toUpperCase();
    const allHistory = Array.from(this.stockPriceHistory.values())
      .filter(h => h.ticker === upperTicker);
    
    if (!fromDate && !toDate) {
      return allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return allHistory
      .filter(h => {
        const historyDate = new Date(h.date);
        const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
        const to = toDate ? new Date(toDate) : new Date('2100-12-31');
        return historyDate >= from && historyDate <= to;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async upsertStockPriceHistory(history: InsertStockPriceHistory): Promise<StockPriceHistory> {
    const key = `${history.ticker}_${history.date}`;
    const existing = this.stockPriceHistory.get(key);
    
    const newHistory: StockPriceHistory = {
      id: existing?.id || randomUUID(),
      ...history,
      ticker: history.ticker.toUpperCase(),
      createdAt: existing?.createdAt || new Date()
    };
    
    this.stockPriceHistory.set(key, newHistory);
    return newHistory;
  }

  async getStockPriceHistoryRange(ticker: string, fromDate: string, toDate: string): Promise<StockPriceHistory[]> {
    return this.getStockPriceHistory(ticker, fromDate, toDate);
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
      userId: insertAlert.userId || null,
      isActive: insertAlert.isActive ?? true,
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

  // Efficient duplicate checking methods
  async existsByAccessionNumber(accessionNumber: string): Promise<boolean> {
    const exists = Array.from(this.insiderTrades.values()).some(
      trade => trade.accessionNumber === accessionNumber
    );
    return exists;
  }

  async existsByAccessionNumbers(accessionNumbers: string[]): Promise<Set<string>> {
    const existingNumbers = new Set<string>();
    const allTrades = Array.from(this.insiderTrades.values());
    
    for (const accessionNumber of accessionNumbers) {
      if (allTrades.some(trade => trade.accessionNumber === accessionNumber)) {
        existingNumbers.add(accessionNumber);
      }
    }
    
    return existingNumbers;
  }

  // HOT/WARM/COLD Data Layer Methods
  async getHotTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    return this.getInsiderTrades(limit, offset, false, threeMonthsAgo.toISOString().split('T')[0]);
  }

  async getWarmTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    const twoYearsAgo = new Date(now.getTime() - (730 * 24 * 60 * 60 * 1000));
    
    const trades = Array.from(this.insiderTrades.values()).filter(trade => {
      const filedDate = new Date(trade.filedDate);
      return filedDate < threeMonthsAgo && filedDate >= twoYearsAgo;
    });
    
    return trades
      .sort((a, b) => new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime())
      .slice(offset, offset + limit);
  }

  async getColdTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    const twoYearsAgo = new Date(Date.now() - (730 * 24 * 60 * 60 * 1000));
    
    const trades = Array.from(this.insiderTrades.values()).filter(trade => {
      const filedDate = new Date(trade.filedDate);
      return filedDate < twoYearsAgo;
    });
    
    return trades
      .sort((a, b) => new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime())
      .slice(offset, offset + limit);
  }

  async organizeDataLayers(): Promise<{ hot: number, warm: number, cold: number }> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    const twoYearsAgo = new Date(now.getTime() - (730 * 24 * 60 * 60 * 1000));

    const allTrades = Array.from(this.insiderTrades.values());
    
    const hot = allTrades.filter(trade => new Date(trade.filedDate) >= threeMonthsAgo).length;
    const warm = allTrades.filter(trade => {
      const filedDate = new Date(trade.filedDate);
      return filedDate < threeMonthsAgo && filedDate >= twoYearsAgo;
    }).length;
    const cold = allTrades.filter(trade => new Date(trade.filedDate) < twoYearsAgo).length;

    return { hot, warm, cold };
  }

  async getLayeredTrades(limit = 20, offset = 0): Promise<InsiderTrade[]> {
    // Return trades in optimal order: HOT first, then WARM, then COLD
    const hotTrades = await this.getHotTrades(Math.min(limit, 50), 0);
    const remainingLimit = limit - hotTrades.length;
    
    if (remainingLimit <= 0) {
      return hotTrades.slice(offset, offset + limit);
    }
    
    const warmTrades = await this.getWarmTrades(remainingLimit, 0);
    const stillRemainingLimit = remainingLimit - warmTrades.length;
    
    let allTrades = [...hotTrades, ...warmTrades];
    
    if (stillRemainingLimit > 0) {
      const coldTrades = await this.getColdTrades(stillRemainingLimit, 0);
      allTrades = [...allTrades, ...coldTrades];
    }
    
    return allTrades.slice(offset, offset + limit);
  }
}

import { DatabaseStorage } from "./db-storage";

// Temporarily use memory storage due to disabled database endpoint
export const storage = new MemStorage(); // process.env.NODE_ENV === 'test' ? new MemStorage() : new DatabaseStorage();
