import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, date, json, decimal, bigint, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),

  // User role for admin access
  role: text("role").notNull().default("user"), // "user" | "admin"

  // Email verification
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"), // Legacy - for link-based verification
  verificationTokenExpires: timestamp("verification_token_expires"),
  verificationCode: text("verification_code"), // 6-digit code for email verification
  verificationCodeExpires: timestamp("verification_code_expires"), // Code expires in 10 minutes

  // Password reset
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"), // Token expires in 1 hour

  // Subscription & Trial Management
  // ⚠️ CRITICAL: Before deleting a user, ALWAYS check stripeSubscriptionId and subscriptionStatus
  // Users with active Stripe subscriptions MUST have their subscriptions canceled in Stripe first
  // Otherwise, orphaned subscriptions will continue charging without user records
  // Recommended: Implement soft delete instead of hard delete for users with payment history
  subscriptionTier: text("subscription_tier").notNull().default("free"), // "free" | "insider_pro"
  subscriptionStatus: text("subscription_status").notNull().default("inactive"), // "active" | "inactive" | "trialing" | "canceled"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),

  // 24-hour Trial System
  trialActivatedAt: timestamp("trial_activated_at"), // When user started 24h trial
  trialExpiresAt: timestamp("trial_expires_at"), // When trial ends
  hasUsedTrial: boolean("has_used_trial").notNull().default(false), // Prevent multiple trials

  // FOMO tracking
  lastTrialNotificationSent: timestamp("last_trial_notification_sent"),

  // Coupon System
  usedCoupons: json("used_coupons").$type<string[]>().default(sql`'[]'::json`), // Array of redeemed coupon codes
  couponExtensionDays: integer("coupon_extension_days").notNull().default(0), // Total days extended via coupons
  lastCouponUsedAt: timestamp("last_coupon_used_at"), // When last coupon was used
});

export const insiderTrades = pgTable("insider_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessionNumber: text("accession_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  ticker: text("ticker"),
  traderName: text("trader_name").notNull().default("Unknown Trader"),
  traderTitle: text("trader_title").default(""),
  tradeType: text("trade_type").notNull().default("BUY"), // All SEC Form 4 codes: P,S,A,M,G,F,X,C,W,U,D
  transactionCode: text("transaction_code"), // Original SEC transaction code (P,S,A,M,G,F,X,C,W,U,D)
  shares: integer("shares").notNull(),
  pricePerShare: real("price_per_share").notNull(),
  totalValue: real("total_value").notNull(),
  ownershipPercentage: real("ownership_percentage").default(0), // Percentage of total shares
  filedDate: timestamp("filed_date").notNull(),
  transactionDate: timestamp("transaction_date"), // Optional: some old records may have NULL
  aiAnalysis: json("ai_analysis"), // deprecated - no longer used
  comprehensiveAnalysis: json("comprehensive_analysis"), // AI analysis with caching (new)
  analysisGeneratedAt: timestamp("analysis_generated_at"), // When AI analysis was generated
  newsLastFetchedAt: timestamp("news_last_fetched_at"), // When news was last fetched
  significanceScore: integer("significance_score").notNull().default(50), // Default neutral score
  signalType: text("signal_type").notNull().default('BUY'), // Default buy signal
  // Data verification fields for accuracy control
  isVerified: boolean("is_verified").notNull().default(false), // Whether price data has been verified
  verificationStatus: text("verification_status").notNull().default('PENDING'), // PENDING, VERIFIED, FAILED
  verificationNotes: text("verification_notes"), // Any notes about verification process
  marketPrice: real("market_price"), // Actual market price on filing date for comparison
  priceVariance: real("price_variance"), // Percentage difference between filed and market price
  secFilingUrl: text("sec_filing_url"), // Direct link to SEC filing for transparency
  // Derivative securities (Table 2) fields
  isDerivative: boolean("is_derivative").notNull().default(false), // Table 2 거래 여부
  underlyingShares: bigint("underlying_shares", { mode: "number" }), // 파생상품의 underlying shares
  derivativeType: varchar("derivative_type", { length: 100 }), // 파생상품 종류 (옵션, 워런트 등)
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
}).extend({
  traderName: z.string().optional(),
  traderTitle: z.string().optional(),
  tradeType: z.enum(['BUY', 'SELL', 'TRANSFER', 'OPTION_EXERCISE', 'GRANT', 'GIFT', 'AWARD', 'TAX', 'CONVERSION', 'INHERIT', 'DISPOSITION', 'OTHER']).optional(),
  transactionCode: z.string().optional(), // Original SEC transaction code
  transactionDate: z.date().optional(), // Transaction date
  ownershipPercentage: z.number().optional(),
  significanceScore: z.number().optional(), // Allow override of default
  signalType: z.enum(['BUY', 'SELL']).optional(), // Allow override of default
  isVerified: z.boolean().optional(),
  verificationStatus: z.string().optional(),
  verificationNotes: z.string().optional(),
  marketPrice: z.number().optional(),
  priceVariance: z.number().optional(),
  secFilingUrl: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInsiderTrade = z.infer<typeof insertInsiderTradeSchema>;
export type InsiderTrade = typeof insiderTrades.$inferSelect & {
  // Enriched fields added by API (not in database)
  currentPrice?: number;
  marketCap?: number | null;
  priceChangePercent?: number;
  priceLastUpdated?: Date | null;
};

// Deprecated - AI analysis no longer used
export type AIAnalysis = {
  significance_score: number;
  signal_type: 'BUY' | 'SELL';
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

// Stock price history for time-series data
export const stockPriceHistory = pgTable("stock_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  date: date("date").notNull(),
  open: decimal("open", { precision: 10, scale: 2 }).notNull(),
  high: decimal("high", { precision: 10, scale: 2 }).notNull(),
  low: decimal("low", { precision: 10, scale: 2 }).notNull(),
  close: decimal("close", { precision: 10, scale: 2 }).notNull(),
  volume: bigint("volume", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create composite unique index for ticker + date
export const stockPriceHistoryIndex = sql`CREATE UNIQUE INDEX IF NOT EXISTS "idx_stock_history_ticker_date" ON "stock_price_history" ("ticker", "date")`;

export const insertStockPriceHistorySchema = createInsertSchema(stockPriceHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertStockPriceHistory = z.infer<typeof insertStockPriceHistorySchema>;
export type StockPriceHistory = typeof stockPriceHistory.$inferSelect;

// Alerts table for user-defined trading alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // CRITICAL FIX: Added CASCADE to prevent orphaned records when user is deleted
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'VOLUME', 'PRICE', 'COMPANY', 'TRADER', 'SIGNAL'
  condition: text("condition").notNull(), // 'greater_than', 'less_than', 'equals', 'contains'
  value: text("value").notNull(), // The threshold or match value
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastTriggered: timestamp("last_triggered"),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// ✅ Performance optimization using logical filtering on main table
// HOT/WARM/COLD data layers are implemented in db-storage.ts using date-based filtering
// This approach provides better performance than separate tables for 500,000+ trades

// Collection runs tracking for monitoring and gap detection
export const collectionRuns = pgTable("collection_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectorName: text("collector_name").notNull(), // "openinsider" | "marketbeat" | "sec-rss"
  status: text("status").notNull().default("running"), // "running" | "success" | "failure"
  tradesCollected: integer("trades_collected").default(0), // Number of new trades added
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"), // Error details if status is "failure"
  metadata: json("metadata"), // Additional info: pages scraped, API calls made, etc.
});

export const insertCollectionRunSchema = createInsertSchema(collectionRuns).omit({
  id: true,
});

export type InsertCollectionRun = z.infer<typeof insertCollectionRunSchema>;
export type CollectionRun = typeof collectionRuns.$inferSelect;

// User events for conversion tracking
export const userEvents = pgTable("user_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // CRITICAL FIX: Added CASCADE to prevent orphaned records when user is deleted
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType: text("event_type").notNull(), // "SIGNUP" | "TRIAL_START" | "TRIAL_END" | "SUBSCRIPTION_START" | "SUBSCRIPTION_END" | "SUBSCRIPTION_CANCEL"
  eventData: json("event_data"), // Additional event-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserEventSchema = createInsertSchema(userEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;
export type UserEvent = typeof userEvents.$inferSelect;

// User sessions for geographic tracking
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // CRITICAL FIX: Added CASCADE to prevent orphaned records when user is deleted
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text("ip_address"),
  country: text("country"), // ISO country code (e.g., "US", "KR")
  countryName: text("country_name"), // Full country name
  region: text("region"), // State/Province
  city: text("city"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// Exchange rates for multi-currency support
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("USD"), // Always USD
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(), // KRW, CNY, JPY, etc.
  rate: decimal("rate", { precision: 15, scale: 6 }).notNull(), // Exchange rate with high precision
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  source: text("source").notNull().default("frankfurter"), // API source
}, (table) => ({
  // Unique constraint for base+target currency pair (required for upsert)
  uniquePair: uniqueIndex("idx_exchange_rates_pair").on(table.baseCurrency, table.targetCurrency),
}));

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  lastUpdated: true,
});

export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
