import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { Button } from "../../common/components/ui/button";
import { AssetCard } from "../../features/assets/components/asset-card";
import { getStockPrice } from "~/lib/stock-api";
import type { Route } from "./+types/home-page";

interface AssetData {
  id: string;
  name: string;
  purchaseDate: string;
  purchasePrice: number;
  good: number;
  bad: number;
  currentPrice: number;
  currentProfit: number;
  currentProfitRate: number;
}

export async function loader({}: Route.LoaderArgs) {
  // 삼성전자 주식 가격 가져오기 (네이버 금융 코드: 005930)
  console.log('[HomePage Loader] 주식 가격 조회 시작');
  const stockPrice = await getStockPrice("005930");
  console.log('[HomePage Loader] 받은 주식 가격:', JSON.stringify(stockPrice, null, 2));
  
  // 구매 정보 (실제로는 데이터베이스에서 가져와야 함)
  const purchasePrice = 70000; // 예시: 70,000원에 구매
  const purchaseDate = "2024-01-15";
  
  const currentProfit = stockPrice.currentPrice - purchasePrice;
  const currentProfitRate = (currentProfit / purchasePrice) * 100;
  
  console.log('[HomePage Loader] 계산된 수익:', { currentProfit, currentProfitRate });

  const assets: AssetData[] = [
    {
      id: "samsung-005930",
      name: stockPrice.name,
      purchaseDate,
      purchasePrice,
      good: 45,
      bad: 12,
      currentPrice: stockPrice.currentPrice,
      currentProfit,
      currentProfitRate,
    },
  ];

  return { assets };
}

export function action({}: Route.ActionArgs) {
  return {};
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | 당신의 은행" },
    { name: "description", content: "Welcome to Your Yield Bank" },
  ];
}

/**
 * 한국 주식 시장이 현재 열려있는지 확인합니다
 */
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = 일요일, 6 = 토요일
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // 주말 체크
  if (day === 0 || day === 6) {
    return false;
  }
  
  // 장중 시간 체크: 09:00 ~ 15:30
  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60; // 09:00
  const marketClose = 15 * 60 + 30; // 15:30
  
  return currentTime >= marketOpen && currentTime <= marketClose;
}

export default function HomePage() {
  const { assets } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // 장중일 때만 30초마다 업데이트, 장 마감 후에는 5분마다 업데이트
  useEffect(() => {
    const updateInterval = isMarketOpen() ? 5000 : 300000; // 장중: 30초, 마감 후: 5분
    
    console.log(`[HomePage] 장 상태: ${isMarketOpen() ? '개장' : '마감'}, 업데이트 주기: ${updateInterval / 1000}초`);
    
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [revalidator]);

  return (
    <div className="px-20 space-y-40">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            내 자산
          </h2>
          <p className="text-xl font-light text-foreground">
            보유한 자산의 현재 상태를 확인하세요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            id={asset.id}
            name={asset.name}
            purchaseDate={asset.purchaseDate}
            purchasePrice={asset.purchasePrice}
            good={asset.good}
            bad={asset.bad}
            currentPrice={asset.currentPrice}
            currentProfit={asset.currentProfit}
            currentProfitRate={asset.currentProfitRate}
          />
        ))}
      </div>
    </div>
  );
}