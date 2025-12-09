-- Migration: Add transaction_date column as NULLABLE to preserve existing data
-- Generated: 2025-12-09
-- Purpose: Fix NOT NULL constraint error that would cause data loss

-- Add transaction_date column as NULLABLE (no default needed)
ALTER TABLE "insider_trades" ADD COLUMN IF NOT EXISTS "transaction_date" timestamp;

-- Note: Existing 4,699 records will have NULL transaction_date
-- New inserts will provide accurate transaction_date from collector
-- filedDate is always available as fallback for existing records
