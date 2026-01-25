import { db } from "~/db";
import { assets } from "~/features/assets/schema";
import { getStockPrice } from "~/lib/stock-api";
export async function getAssetWithPrices() {
      // 삼성전자 주식 가격 가져오기 (네이버 금융 코드: 005930)
  console.log('[getAssetWithPrices] 함수 호출 시작:', new Date().toISOString());
  console.log('[HomePage Loader] 주식 가격 조회 시작');
  //const stockPrice = await getStockPrice("005930");
  //console.log('[HomePage Loader] 받은 주식 가격:', JSON.stringify(stockPrice, null, 2));
  
  const allAssets = await db.select().from(assets);
  
  console.log('[getAssetWithPrices] DB에서 가져온 자산 개수:', allAssets.length);
  
  // 모든 자산의 주식 가격을 병렬로 가져오기
  const assetsWithPrices = await Promise.all(
    allAssets.map(async (asset) => {
      try {
        console.log(`[getAssetWithPrices] ${asset.symbol} 가격 조회 시작`);
        const stockPrice = await getStockPrice(asset.symbol);
        console.log(`[getAssetWithPrices] ${asset.symbol} 가격 조회 완료:`, stockPrice.currentPrice);
        const currentProfit = stockPrice.currentPrice - asset.purchasePrice;
        const currentProfitRate = (currentProfit / asset.purchasePrice) * 100;
        
        return {
          ...asset,
          currentPrice: stockPrice.currentPrice,
          currentProfit,
          currentProfitRate,
        };
      } catch (error) {
        console.error(`[HomePage Loader] ${asset.symbol} 가격 조회 실패:`, error);
        // 에러 발생 시 기존 값 사용
        return {
          ...asset,
          currentProfit: -999,
          currentProfitRate: -999,
        };
      }
    })
  );
  console.log('[getAssetWithPrices] 모든 자산 가격 조회 완료:', assetsWithPrices.length);
  console.log('[getAssetWithPrices] 함수 호출 완료:', new Date().toISOString());
  return {
    assets: assetsWithPrices.map((asset) => ({
      id: asset.asset_id.toString(),
      name: asset.name,
      purchaseDate: asset.purchaseDate.toISOString().split('T')[0],
      purchasePrice: asset.purchasePrice,
      good: 0,
      bad: 0,
      currentPrice: asset.currentPrice,
      currentProfit: asset.currentProfit,
      currentProfitRate: asset.currentProfitRate ?? 0,
      hidden: asset.hidden,
      take_profit_rate: asset.take_profit_rate != null ? parseFloat(asset.take_profit_rate.toString()) || 0 : 0,
      stop_loss_rate: asset.stop_loss_rate != null ? parseFloat(asset.stop_loss_rate.toString()) || 0 : 0,
    })),
  };
}