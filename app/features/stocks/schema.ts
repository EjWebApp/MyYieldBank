import {boolean, integer, numeric, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import { profiles } from "../users/schema";


// 사용자가 구매한 주식 보유 내역 테이블
export const stockHoldings = pgTable("stock_holdings", {
    // 보유 종목 ID (기본키)
    holding_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // 종목명
    name: text().notNull(),
    // 종목 코드
    symbol: text().notNull(),
    // 구매 가격
    purchase_price: integer().notNull(),
    // 구매 일자
    purchase_date: timestamp().notNull(),
    // 현재 가격
    current_price: integer().notNull(),
    // 현재 일자
    current_date: timestamp().notNull(),
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
    created_at: timestamp().notNull().defaultNow(),
    // 수정일
    updated_at: timestamp().notNull().defaultNow(),
    profile_id: uuid().references(
        () => profiles.profile_id,{
            onDelete: "cascade",
        }).notNull()
    
});
