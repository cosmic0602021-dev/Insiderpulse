CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"condition" text NOT NULL,
	"value" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_triggered" timestamp
);
--> statement-breakpoint
CREATE TABLE "collection_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collector_name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"trades_collected" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_message" text,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"target_currency" varchar(3) NOT NULL,
	"rate" numeric(15, 6) NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'frankfurter' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insider_trades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accession_number" text NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text,
	"trader_name" text DEFAULT 'Unknown Trader' NOT NULL,
	"trader_title" text DEFAULT '',
	"trade_type" text DEFAULT 'BUY' NOT NULL,
	"transaction_code" text,
	"shares" integer NOT NULL,
	"price_per_share" real NOT NULL,
	"total_value" real NOT NULL,
	"ownership_percentage" real DEFAULT 0,
	"filed_date" timestamp NOT NULL,
	"transaction_date" timestamp,
	"ai_analysis" json,
	"comprehensive_analysis" json,
	"analysis_generated_at" timestamp,
	"news_last_fetched_at" timestamp,
	"significance_score" integer DEFAULT 50 NOT NULL,
	"signal_type" text DEFAULT 'BUY' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'PENDING' NOT NULL,
	"verification_notes" text,
	"market_price" real,
	"price_variance" real,
	"sec_filing_url" text,
	"is_derivative" boolean DEFAULT false NOT NULL,
	"underlying_shares" bigint,
	"derivative_type" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "insider_trades_accession_number_unique" UNIQUE("accession_number")
);
--> statement-breakpoint
CREATE TABLE "stock_price_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"date" date NOT NULL,
	"open" numeric(10, 2) NOT NULL,
	"high" numeric(10, 2) NOT NULL,
	"low" numeric(10, 2) NOT NULL,
	"close" numeric(10, 2) NOT NULL,
	"volume" bigint NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"change" numeric(10, 2) NOT NULL,
	"change_percent" numeric(5, 2) NOT NULL,
	"volume" bigint,
	"market_cap" bigint,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_prices_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"event_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ip_address" text,
	"country" text,
	"country_name" text,
	"region" text,
	"city" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"role" text DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_token_expires" timestamp,
	"verification_code" text,
	"verification_code_expires" timestamp,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'inactive' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"trial_activated_at" timestamp,
	"trial_expires_at" timestamp,
	"has_used_trial" boolean DEFAULT false NOT NULL,
	"last_trial_notification_sent" timestamp,
	"used_coupons" json DEFAULT '[]'::json,
	"coupon_extension_days" integer DEFAULT 0 NOT NULL,
	"last_coupon_used_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_exchange_rates_pair" ON "exchange_rates" USING btree ("base_currency","target_currency");