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
	"ai_analysis" json,
	"significance_score" integer DEFAULT 50 NOT NULL,
	"signal_type" text DEFAULT 'BUY' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'PENDING' NOT NULL,
	"verification_notes" text,
	"market_price" real,
	"price_variance" real,
	"sec_filing_url" text,
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
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;