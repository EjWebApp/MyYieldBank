CREATE TABLE "assets" (
	"asset_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assets_asset_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"purchasePrice" integer NOT NULL,
	"purchaseDate" timestamp NOT NULL,
	"currentPrice" integer NOT NULL,
	"currentDate" timestamp NOT NULL,
	"profitRate" integer NOT NULL
);
