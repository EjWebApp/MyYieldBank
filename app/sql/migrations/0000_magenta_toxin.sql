CREATE TABLE IF NOT EXISTS "stock_holdings" (
	"holding_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stock_holdings_holding_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"purchase_price" integer NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"current_price" integer NOT NULL,
	"current_date" timestamp NOT NULL,
	"profit_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"take_profit_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stop_loss_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"profile_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"avatar" text,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"headline" text,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'stock_holdings_profile_id_profiles_profile_id_fk'
	) THEN
		ALTER TABLE "stock_holdings" ADD CONSTRAINT "stock_holdings_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'profiles_profile_id_users_id_fk'
	) THEN
		ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;