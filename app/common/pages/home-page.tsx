import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { AssetCard } from "../../features/assets/components/asset-card";
import type { Route } from "./+types/home-page";
import { getAssetWithPrices } from "~/lib/stock-util";

export async function loader({}: Route.LoaderArgs) {
  const assetsWithPrices = await getAssetWithPrices();
  return { assets: assetsWithPrices.assets };
}

export default function HomePage() {
  const { assets } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // 3초마다 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 3000);

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