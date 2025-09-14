import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, json } from "drizzle-orm/pg-core";
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
  aiAnalysis: json("ai_analysis"),
  significanceScore: integer("significance_score").notNull(),
  signalType: text("signal_type").notNull(), // BUY, SELL, HOLD
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
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInsiderTrade = z.infer<typeof insertInsiderTradeSchema>;
export type InsiderTrade = typeof insiderTrades.$inferSelect;

export type AIAnalysis = {
  significance_score: number;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  key_insights: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
};

export type TradingStats = {
  todayTrades: number;
  totalVolume: number;
  hotBuys: number;
  avgSignificance: number;
};
