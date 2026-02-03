import { db } from "~/db";
import { stockHoldings } from "~/features/stocks/schema";
import { getStockPrice } from "~/lib/stock-api";
export async function getAssetWithPrices({allStocks}: {allStocks: any[]}) {
      // 삼성전자 주식 가격 가져오기 (네이버 금융 코드: 005930)
  console.log('[getAssetWithPrices] 함수 호출 시작:', new Date().toISOString());
  console.log('[HomePage Loader] 주식 가격 조회 시작');  
  console.log('[getAssetWithPrices] DB에서 가져온 종목 개수:', allStocks.length);
  
  // 모든 종목의 주식 가격을 병렬로 가져오기
  const stocksWithPrices = await Promise.all(
    allStocks.map(async (stock) => {
      try {
        console.log(`[getAssetWithPrices] ${stock.symbol} 가격 조회 시작`);
        const stockPrice = await getStockPrice(stock.symbol);
        console.log(`[getAssetWithPrices] ${stock.symbol} 가격 조회 완료:`, stockPrice.currentPrice);
        const currentProfit = stockPrice.currentPrice - stock.purchase_price;
        const currentProfitRate = (currentProfit / stock.purchase_price) * 100;
        
        return {
          ...stock,
          currentPrice: stockPrice.currentPrice,
          currentProfit,
          currentProfitRate,
        };
      } catch (error) {
        console.error(`[HomePage Loader] ${stock.symbol} 가격 조회 실패:`, error);
        // 에러 발생 시 기존 값 사용
        return {
          ...stock,
          currentProfit: -999,
          currentProfitRate: -999,
        };
      }
    })
  );
  console.log('[getAssetWithPrices] 모든 종목 가격 조회 완료:', stocksWithPrices.length);
  console.log('[getAssetWithPrices] 함수 호출 완료:', new Date().toISOString());
  return {
    stocks: stocksWithPrices.map((stock) => ({
      id: stock.holding_id.toString(),
      name: stock.name,
      purchaseDate: stock.purchase_date.toISOString().split('T')[0],
      purchasePrice: stock.purchase_price,
      good: 0,
      bad: 0,
      currentPrice: stock.current_price,
      currentProfit: stock.currentProfit,
      currentProfitRate: stock.currentProfitRate ?? 0,
      hidden: stock.hidden,
      take_profit_rate: stock.take_profit_rate != null ? parseFloat(stock.take_profit_rate.toString()) || 0 : 0,
      stop_loss_rate: stock.stop_loss_rate != null ? parseFloat(stock.stop_loss_rate.toString()) || 0 : 0,
    })),
  };
}