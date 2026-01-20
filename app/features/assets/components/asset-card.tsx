import { Link, useFetcher } from "react-router";
import { Button } from "~/common/components/ui/button";

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
  hidden: boolean;
  showHiddenToggle?: boolean;
  showModifyButton?: boolean;
  showDeleteButton?: boolean;
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
  hidden,
  showModifyButton = false,
  showDeleteButton = false,
  showHiddenToggle = false,
}: AssetCardProps) {
  const profitColor = currentProfit >= 0 ? "text-green-600" : "text-red-600";
  const profitRateColor = currentProfitRate >= 0 ? "text-green-600" : "text-red-600";
  const deleteFetcher = useFetcher();
  const toggleHiddenFetcher = useFetcher();

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
      <div className="flex gap-2 pt-2 border-t">
        {showModifyButton ? (
          <Button asChild size="sm" variant="outline">
            <Link to={`/assets/${id}/edit`}>수정</Link>
          </Button>
        ) : null}

        {showHiddenToggle ? (
          <toggleHiddenFetcher.Form method="post" action={`/assets/${id}/toggle-hidden`}>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={toggleHiddenFetcher.state !== "idle"}
            >
              {hidden ? "보이기" : "감추기"}
            </Button>
          </toggleHiddenFetcher.Form>
        ) : null}
        {showDeleteButton ? (
        <deleteFetcher.Form method="post" action={`/assets/${id}/delete`} className="ml-auto">
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={deleteFetcher.state !== "idle"}
          >
            삭제
          </Button>
        </deleteFetcher.Form>
        ) : null}
      </div>
    </div>
  );
}
