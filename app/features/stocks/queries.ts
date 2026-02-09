import { getStockPrice } from "~/lib/stock-api";
import { makeSSRClient } from "~/supa-client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";


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
                        timestamp: priceInfo.timestamp, // getStockPrice에서 받은 timestamp 사용
                    };
                } catch (error) {
                    console.error(`[getStockHoldings] ${stock.symbol} 가격 조회 실패:`, error);
                    // 에러 발생 시 기존 데이터베이스의 current_price 사용
                    return {
                        ...stock,
                        current_price: stock.current_price || 0,
                        timestamp: stock.current_date || null, // current_date가 없으면 null
                    };
                }
            })
        );
        
        // 수익률 계산 및 StockCard 형식으로 변환
        const stocksWithProfit = stocksWithPrices.map((stock) => {
            const purchase_price = stock.purchase_price ?? 0;
            const current_price = stock.current_price ?? 0;
            const current_profit = current_price - purchase_price;
            // timestamp를 한국시간으로 보기 좋게 포맷팅 (없으면 null)
            const timestamp = stock.timestamp 
                ? format(new Date(stock.timestamp), "HH:mm:ss", { locale: ko })
                : null;
            // purchase_price가 0이면 나누기 에러 방지
            const current_profit_rate = purchase_price > 0 
                ? (current_profit / purchase_price) * 100 
                : 0;
            
            // 날짜 파싱 (YYYY-MM-DD 형식)
            const purchaseDate = stock.purchase_date 
                ? new Date(stock.purchase_date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            
            return {
                id: stock.holding_id?.toString() || '',
                name: stock.name || '',
                timestamp,
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