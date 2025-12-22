-- Migration: Add push notification support for PWA and Apps-in-Toss
-- Created: 2025-01-XX
-- Description: Adds notification subscriptions, logs, and Toss user mappings

-- 1. Notification Subscriptions Table
-- Stores user subscriptions to specific tickers for push notifications
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  company_name VARCHAR(200) NOT NULL,

  -- Platform identification
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('pwa', 'appintos')),

  -- PWA Web Push API fields
  push_endpoint TEXT,
  push_p256dh TEXT,
  push_auth TEXT,

  -- Apps-in-Toss fields
  toss_user_key VARCHAR(255),

  -- Notification preferences
  notify_on_buy BOOLEAN NOT NULL DEFAULT true,
  notify_on_sell BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  last_notified_at TIMESTAMP,
  notification_count INTEGER DEFAULT 0,

  -- Ensure unique subscription per user per ticker per platform
  CONSTRAINT unique_user_ticker_platform UNIQUE (user_id, ticker, platform)
);

-- Indexes for efficient queries
CREATE INDEX idx_subscriptions_ticker ON notification_subscriptions(ticker);
CREATE INDEX idx_subscriptions_user ON notification_subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON notification_subscriptions(is_active) WHERE is_active = true;

-- 2. Notification Logs Table
-- Tracks all notification attempts for debugging and analytics
CREATE TABLE IF NOT EXISTS notification_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subscription_id VARCHAR REFERENCES notification_subscriptions(id) ON DELETE CASCADE,
  trade_id VARCHAR REFERENCES insider_trades(id) ON DELETE SET NULL,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,

  platform VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,

  sent_at TIMESTAMP DEFAULT NOW(),

  -- Notification content for debugging
  title TEXT,
  body TEXT,
  metadata JSON
);

-- Indexes for logs
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- 3. Toss User Mappings Table
-- Maps Toss user keys to InsiderPulse user accounts
CREATE TABLE IF NOT EXISTS toss_user_mappings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  toss_user_key VARCHAR(255) NOT NULL UNIQUE,

  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,

  -- Ensure one Toss user maps to one InsiderPulse account
  CONSTRAINT unique_user_toss UNIQUE (user_id)
);

-- Index for Toss user key lookups
CREATE INDEX idx_toss_mapping_key ON toss_user_mappings(toss_user_key);

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notification_subscriptions TO your_app_user;
-- GRANT SELECT, INSERT ON notification_logs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON toss_user_mappings TO your_app_user;

-- Success message
SELECT 'Push notification tables created successfully!' AS status;
