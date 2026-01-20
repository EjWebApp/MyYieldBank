import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { Button } from "../../common/components/ui/button";
import { AssetCard } from "../../features/assets/components/asset-card";
import { getStockPrice } from "~/lib/stock-api";
import type { Route } from "./+types/home-page";
import { db } from "~/db";
import { assets } from "../../features/assets/schema";
import { isMarketOpen } from "~/lib/utils";
import { getAssetWithPrices } from "~/lib/stock-util";

export async function loader({}: Route.LoaderArgs) {
  const assetsWithPrices = await getAssetWithPrices();
  return { assets: assetsWithPrices.assets };
}

export default function HomePage() {
  const { assets } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // 장중일 때만 30초마다 업데이트, 장 마감 후에는 5분마다 업데이트
  useEffect(() => {
    const updateInterval = isMarketOpen() ? 5000 : 300000; // 장중: 5초, 마감 후: 5분 
    
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
        {assets.map((asset) => {
          return asset.hidden ? null : (
            <AssetCard key={asset.id} {...asset} showModifyButton={true} showDeleteButton={true} showHiddenToggle={true} />
          );
        })}
      </div>
    </div>
  );
}