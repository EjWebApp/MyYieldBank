import { Button } from "~/common/components/ui/button";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/assets-page";
import { AssetCard } from "../components/asset-card";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { assets } from "../schema";

export async function loader({}: Route.LoaderArgs) {
  const allAssets = await db.select().from(assets);
  
  return {
    assets: allAssets.map((asset) => ({
      id: asset.asset_id.toString(),
      name: asset.name,
      purchaseDate: asset.purchaseDate.toISOString().split('T')[0],
      purchasePrice: asset.purchasePrice,
      good: 0,
      bad: 0,
      currentPrice: asset.currentPrice,
      currentProfit: asset.currentPrice - asset.purchasePrice,
      currentProfitRate: asset.profitRate,
    })),
  };
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

  return (
    <div className="space-y-20">
      <Hero title="종목" subtitle="보유한 종목을 관리합니다." />
      <div className="grid grid-cols-2 items-start gap-4">
        <div className="col-span-1">
          <div className="flex justify-end">
            <Button asChild>
              <Link to="/assets/new">종목 추가</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset: typeof assets[0]) => (
              <AssetCard key={asset.id} {...asset} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

