import { Button } from "~/common/components/ui/button";
import { Link, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/assets-page";
import { AssetCard } from "../components/asset-card";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { assets } from "../schema";
import { getAssetWithPrices } from "~/lib/stock-util";
import { useEffect } from "react";
import { isMarketOpen } from "~/lib/utils";

export async function loader({}: Route.LoaderArgs) {
  const assetsWithPrices = await getAssetWithPrices();
  return { assets: assetsWithPrices.assets };
}

export function action({}: Route.ActionArgs) {
  return {};
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Products | wemake" },
    { name: "description", content: "Browse all products" },
  ];
}

export default function AssetsPage() {
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
    <div className="space-y-20">
      <Hero title="종목" subtitle="보유한 종목을 관리합니다." />
      <div className="flex justify-end">
            <Button asChild>
              <Link to="/assets/new">종목 추가</Link>
            </Button>
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
            hidden={asset.hidden}
            showModifyButton={true}
            showDeleteButton={true}
            showHiddenToggle={true}
          />
        ))}
      </div>      
    </div>
  );
}

