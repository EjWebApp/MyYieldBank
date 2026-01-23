ALTER TABLE "assets" RENAME COLUMN "my_current_rate" TO "profitRate";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "take_profit_rate";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "stop_loss_rate";