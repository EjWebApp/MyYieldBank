interface AssetCardProps {
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

export function AssetCard({
  id,
  name,
  purchaseDate,
  purchasePrice,
  good,
  bad,
  currentPrice,
  currentProfit,
  currentProfitRate,
}: AssetCardProps) {
  const profitColor = currentProfit >= 0 ? "text-green-600" : "text-red-600";
  const profitRateColor = currentProfitRate >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-muted-foreground">구매일: {purchaseDate}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">구매가</span>
          <span className="font-semibold">{purchasePrice.toLocaleString()}원</span>
        </div>        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">현재가</span>
          <span className="font-semibold">{currentPrice.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">수익</span>
          <span className={`font-semibold ${profitColor}`}>
            {currentProfit >= 0 ? "+" : ""}{currentProfit.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">수익률</span>
          <span className={`font-semibold ${profitRateColor}`}>
            {currentProfitRate >= 0 ? "+" : ""}{currentProfitRate.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground pt-2 border-t">
        <span>👍 {good}</span>
        <span>👎 {bad}</span>
      </div>
    </div>
  );
}
