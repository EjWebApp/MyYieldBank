import { getStockPrice } from "~/lib/stock-api";
import { makeSSRClient } from "~/supa-client";


export const getStockHoldings = async (request: Request) => {
    try {
        const { client } = makeSSRClient(request);
        const { data, error } = await client.from("stock_holdings").select("*");
        
        if (error) {
            console.error('[getStockHoldings] 데이터베이스 조회 에러:', error);
            throw error;
        }
        
        // data가 배열이 아니거나 null인 경우 처리
        if (!data || !Array.isArray(data)) {
            console.warn('[getStockHoldings] 데이터가 배열이 아닙니다:', data);
            return [];
        }
        
        console.log(`[getStockHoldings] ${data.length}개 종목 조회 시작`);
        
        // 모든 주식의 현재 가격을 비동기로 가져오기
        const stocksWithPrices = await Promise.all(
            data.map(async (stock: any) => {
                try {
                    if (!stock.symbol) {
                        console.warn('[getStockHoldings] 종목코드가 없습니다:', stock);
                        return stock;
                    }
                    
                    const priceInfo = await getStockPrice(stock.symbol);
                    return {
                        ...stock,
                        current_price: priceInfo.currentPrice || stock.current_price || 0,
                    };
                } catch (error) {
                    console.error(`[getStockHoldings] ${stock.symbol} 가격 조회 실패:`, error);
                    // 에러 발생 시 기존 데이터베이스의 current_price 사용
                    return {
                        ...stock,
                        current_price: stock.current_price || 0,
                    };
                }
            })
        );
        
        // 수익률 계산 및 StockCard 형식으로 변환
        const stocksWithProfit = stocksWithPrices.map((stock) => {
            const purchase_price = stock.purchase_price ?? 0;
            const current_price = stock.current_price ?? 0;
            const current_profit = current_price - purchase_price;
            
            // purchase_price가 0이면 나누기 에러 방지
            const current_profit_rate = purchase_price > 0 
                ? (current_profit / purchase_price) * 100 
                : 0;
            
            // 날짜 파싱 안전하게 처리
            let purchaseDate: string;
            try {
                if (stock.purchase_date instanceof Date) {
                    purchaseDate = stock.purchase_date.toISOString().split('T')[0];
                } else if (stock.purchase_date) {
                    purchaseDate = new Date(stock.purchase_date).toISOString().split('T')[0];
                } else {
                    purchaseDate = new Date().toISOString().split('T')[0];
                }
            } catch (error) {
                console.error('[getStockHoldings] 날짜 파싱 에러:', error, stock.purchase_date);
                purchaseDate = new Date().toISOString().split('T')[0];
            }
            
            return {
                id: stock.holding_id?.toString() || '',
                name: stock.name || '',
                purchaseDate,
                purchasePrice: purchase_price,
                currentPrice: current_price,
                currentProfit: current_profit,
                currentProfitRate: Number(current_profit_rate.toFixed(2)),
                hidden: stock.hidden ?? false,
                good: 0,
                bad: 0,
                stop_loss_rate: stock.stop_loss_rate != null ? parseFloat(stock.stop_loss_rate.toString()) : 0,
                take_profit_rate: stock.take_profit_rate != null ? parseFloat(stock.take_profit_rate.toString()) : 0,
            };
        });
        
        console.log(`[getStockHoldings] ${stocksWithProfit.length}개 종목 처리 완료`);
        return stocksWithProfit;
    } catch (error) {
        console.error('[getStockHoldings] 전체 에러:', error);
        throw error;
    }
}