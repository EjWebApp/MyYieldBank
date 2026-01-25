import {boolean, integer, numeric, pgTable, text, timestamp} from "drizzle-orm/pg-core";

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
    // 수익률 (소수점 두째 자리)
    profit_rate: numeric("profit_rate", { precision: 10, scale: 2 }).notNull().default("0"),
    // 익절률 (소수점 두째 자리)
    take_profit_rate: numeric("take_profit_rate", { precision: 10, scale: 2 }).notNull().default("0"),
    // 손절률 (소수점 두째 자리)
    stop_loss_rate: numeric("stop_loss_rate", { precision: 10, scale: 2 }).notNull().default("0"),
    // 활성화
    enabled: boolean().notNull().default(true),
    // 감추기
    hidden: boolean().notNull().default(false),
    // 등록일
    createdAt: timestamp().notNull().defaultNow(),
    // 수정일
    updatedAt: timestamp().notNull().defaultNow(),
});