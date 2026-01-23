ALTER TABLE "assets" RENAME COLUMN "profitRate" TO "profit_rate";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "take_profit_rate" numeric(10, 1) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "stop_loss_rate" numeric(10, 1) DEFAULT '0';