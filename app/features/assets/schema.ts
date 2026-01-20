import {boolean, integer, pgTable, text, timestamp} from "drizzle-orm/pg-core";

export const assets = pgTable("assets", {
    // 자산 ID (기본키)
    asset_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // 종목명
    name: text().notNull(),
    // 종목 코드
    symbol: text().notNull(),
    // 구매 가격
    purchasePrice: integer().notNull(),
    // 구매 일자
    purchaseDate: timestamp().notNull(),
    // 현재 가격
    currentPrice: integer().notNull(),
    // 현재 일자
    currentDate: timestamp().notNull(),
    // 수익률
    profitRate: integer().notNull(),
    // 활성화
    enabled: boolean().notNull().default(true),
    // 감추기
    hidden: boolean().notNull().default(false),
    // 등록일
    createdAt: timestamp().notNull().defaultNow(),
    // 수정일
    updatedAt: timestamp().notNull().defaultNow(),
});