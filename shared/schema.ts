import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, json, decimal, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insiderTrades = pgTable("insider_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessionNumber: text("accession_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  ticker: text("ticker"),
  shares: integer("shares").notNull(),
  pricePerShare: real("price_per_share").notNull(),
  totalValue: real("total_value").notNull(),
  filedDate: timestamp("filed_date").notNull(),
  aiAnalysis: json("ai_analysis"), // deprecated - no longer used
  significanceScore: integer("significance_score").notNull().default(50), // Default neutral score
  signalType: text("signal_type").notNull().default('HOLD'), // Default neutral signal
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Add index on accessionNumber for fast duplicate checking
  accessionNumberIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS "accession_number_idx" ON "insider_trades" ("accession_number")`,
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertInsiderTradeSchema = createInsertSchema(insiderTrades).omit({
  id: true,
  significanceScore: true, // Use default value
  signalType: true, // Use default value
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInsiderTrade = z.infer<typeof insertInsiderTradeSchema>;
export type InsiderTrade = typeof insiderTrades.$inferSelect;

// Deprecated - AI analysis no longer used
export type AIAnalysis = {
  significance_score: number;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  key_insights: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
} | null;

export type TradingStats = {
  todayTrades: number;
  totalVolume: number;
};

// Stock price information
export const stockPrices = pgTable("stock_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: varchar("ticker", { length: 10 }).notNull().unique(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  volume: bigint("volume", { mode: "number" }),
  marketCap: bigint("market_cap", { mode: "number" }),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertStockPriceSchema = createInsertSchema(stockPrices).omit({
  id: true,
  lastUpdated: true,
});

export type InsertStockPrice = z.infer<typeof insertStockPriceSchema>;
export type StockPrice = typeof stockPrices.$inferSelect;
