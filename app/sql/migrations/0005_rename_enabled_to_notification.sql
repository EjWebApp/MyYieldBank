-- Rename enabled to notification_enabled in stock_holdings
ALTER TABLE "stock_holdings" RENAME COLUMN "enabled" TO "notification_enabled";
