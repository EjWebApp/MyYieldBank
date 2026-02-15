CREATE TABLE "stock_notifications" (
	"notification_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stock_notifications_notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"holding_id" integer NOT NULL,
	"profile_id" uuid NOT NULL,
	"notification_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "stock_notifications" ADD CONSTRAINT "stock_notifications_holding_id_stock_holdings_holding_id_fk" FOREIGN KEY ("holding_id") REFERENCES "public"."stock_holdings"("holding_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_notifications" ADD CONSTRAINT "stock_notifications_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;