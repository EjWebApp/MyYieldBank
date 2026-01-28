-- 테이블이 이미 존재하는 경우를 대비해 IF NOT EXISTS 사용
CREATE TABLE IF NOT EXISTS "assets" (
	"asset_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assets_asset_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"purchasePrice" integer NOT NULL,
	"purchaseDate" timestamp NOT NULL,
	"currentPrice" integer NOT NULL,
	"currentDate" timestamp NOT NULL,
	"profit_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"take_profit_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stop_loss_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
