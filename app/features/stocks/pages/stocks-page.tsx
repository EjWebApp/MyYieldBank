import { Button } from "~/common/components/ui/button";
import { Link, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/stocks-page";
import { StockCard } from "../components/stock-card";
import { Hero } from "~/common/components/hero";
import { getAssetWithPrices } from "~/lib/stock-util";
import { useEffect } from "react";
import { isMarketOpen } from "~/lib/utils";
import { getStockHoldings } from "../queries";
import { makeSSRClient } from "~/supa-client";
export async function loader({request}: Route.LoaderArgs) {
  const stocksWithPrices = await getStockHoldings(request);
  return { stocks: stocksWithPrices };
}

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Stocks | wemake" },
    { name: "description", content: "보유한 종목을 관리합니다" },
  ];
};

export default function StockPage() {
  // 페이크 주식 데이터
  const fakeStocks = [
    {
      id: '1',
      name: '삼성전자',
      purchaseDate: '2024-01-15',
      purchasePrice: 70000,
      currentPrice: 73500,
      currentProfit: 3500,
      currentProfitRate: 5.0,
      hidden: false,
      stop_loss_rate: 5.0,
      take_profit_rate: 10.0,
    },
    {
      id: '2',
      name: '카카오페이',
      purchaseDate: '2024-02-01',
      purchasePrice: 60000,
      currentPrice: 63500,
      currentProfit: 3500,
      currentProfitRate: 5.83,
      hidden: false,
      stop_loss_rate: 3.0,
      take_profit_rate: 8.0,
    },
    {
      id: '3',
      name: 'SK하이닉스',
      purchaseDate: '2024-01-20',
      purchasePrice: 120000,
      currentPrice: 115000,
      currentProfit: -5000,
      currentProfitRate: -4.17,
      hidden: false,
      stop_loss_rate: 5.0,
      take_profit_rate: 15.0,
    },
    {
      id: '4',
      name: 'NAVER',
      purchaseDate: '2024-01-10',
      purchasePrice: 200000,
      currentPrice: 210000,
      currentProfit: 10000,
      currentProfitRate: 5.0,
      hidden: false,
      stop_loss_rate: 5.0,
      take_profit_rate: 10.0,
    },
    {
      id: '5',
      name: 'LG전자',
      purchaseDate: '2024-02-05',
      purchasePrice: 95000,
      currentPrice: 98000,
      currentProfit: 3000,
      currentProfitRate: 3.16,
      hidden: false,
      stop_loss_rate: 5.0,
      take_profit_rate: 10.0,
    },
  ];

  return (
    <div className="space-y-20">
      <Hero title="종목" subtitle="보유한 종목을 관리합니다." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fakeStocks.map((stock) => (
          <StockCard
            key={stock.id}
            id={stock.id}
            name={stock.name}
            purchaseDate={stock.purchaseDate}
            purchasePrice={stock.purchasePrice}
            currentPrice={stock.currentPrice}
            currentProfit={stock.currentProfit}
            currentProfitRate={stock.currentProfitRate}
            hidden={stock.hidden}
            showModifyButton={true}
            showDeleteButton={true}
            showHiddenToggle={true}
            stop_loss_rate={stock.stop_loss_rate}
            take_profit_rate={stock.take_profit_rate}
          />
        ))}
      </div>
    </div>
  );
}
