import { useLoaderData, useFetcher, Link } from "react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { StockCard } from "../../features/stocks/components/stock-card";
import type { Route } from "./+types/home-page";
import { getStockHoldings } from "~/features/stocks/queries";
import { Button } from "~/common/components/ui/button";

function isRedirectResponse(value: unknown): value is Response {
  return value instanceof Response && value.status >= 300 && value.status < 400;
}

export async function loader({ request }: Route.LoaderArgs) {
  console.log('[HomePage] loader 시작');
  const url = new URL(request.url);
  const stocksOnly = url.searchParams.get('stocks-only') === 'true';
  if (stocksOnly) {
    console.log('[HomePage] 주식 데이터만 갱신 (fetcher 등)');
  }
  try {
    const stocks = await getStockHoldings(request);
    // 계산된 totals (투자금/총자산/수익 등)
    const invested = stocks.reduce((sum: number, s: any) => sum + ((s.purchasePrice ?? 0) * (s.purchaseQuantity ?? 1)), 0);
    const totalProfit = stocks.reduce((sum: number, s: any) => sum + (s.currentProfit ?? 0), 0);
    const totalAssets = invested + totalProfit;
    const profitRate = invested > 0 ? (totalProfit / invested) * 100 : 0;

    const totals = { invested, totalAssets, totalProfit, profitRate };
    return { stocks, totals };
  } catch (error) {
    if (isRedirectResponse(error)) throw error;
    console.error('[HomePage] loader 에러:', error);
    return { stocks: [] };
  }
}

export default function HomePage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [currentTime, setCurrentTime] = useState(new Date());

  // fetcher 데이터가 있으면 사용, 없으면 loader 데이터 사용
  const stocks = (fetcher.data?.stocks ?? loaderData.stocks) || [];
  const visibleStocks = stocks.filter((s: { hidden?: boolean }) => !s.hidden);
  const hasNoStocks = visibleStocks.length === 0;

  // 현재 시간을 1초마다 업데이트
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // 3초마다 주식 데이터만 갱신 (인증 체크 없이)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[HomePage] 자동 업데이트 실행 (주식 데이터만, 인증 체크 없음)');
      // fetcher를 사용하여 주식 데이터만 가져오기
      fetcher.load("/home?stocks-only=true");
    }, 3000);

    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      console.log('[HomePage] 자동 업데이트 정리');
      clearInterval(interval);
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 설정

  const totals = fetcher.data?.totals ?? loaderData.totals ?? null;

  return (
    <div className="space-y-40">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="flex items-start justify-between">
            <div className="text-left">
              {totals ? (
                <>
                  <div className="text-4xl lg:text-5xl font-extrabold">
                    {new Intl.NumberFormat('ko-KR').format(Math.round(totals.totalAssets))}원
                  </div>
                  <div className={`text-lg ${totals.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {totals.profitRate >= 0 ? '+' : ''}{totals.profitRate.toFixed(2)}% ({new Intl.NumberFormat('ko-KR').format(Math.round(totals.totalProfit))}원)
                  </div>
                  <div className="text-sm text-muted-foreground">총 투자금 {new Intl.NumberFormat('ko-KR').format(Math.round(totals.invested))}원</div>
                </>
              ) : null}
            </div>

            <div className="text-right">
              <h2 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
                내 자산
              </h2>
              <h3 className="text-xl lg:text-4xl leading-tight tracking-tight">
                {format(currentTime, "yyyy-MM-dd HH:mm:ss", { locale: ko })}
              </h3>
            </div>
          </div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hasNoStocks ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4 space-y-6">
            <p className="text-2xl font-medium text-foreground leading-relaxed">
              나와 가족만 걱정해주는 나의 자산 이제 AI가 함께 걱정해줍니다.
            </p>
            <p className="text-xl text-muted-foreground">
              지금 관심있는 자산을 등록해 보세요!
            </p>
            <p className="text-base text-muted-foreground/80 italic">
              AI now takes care of your assets, even if you only worry about yourself and your family.
            </p>
            <p className="text-sm text-muted-foreground/80 italic">
              Register the assets you&apos;re interested in now!
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/stocks/new">자산 등록하기</Link>
            </Button>
          </div>
        ) : (
          visibleStocks.map((stock: any) => (
            <StockCard key={stock.id} {...stock} />
          ))
        )}
      </div>
    </div>
  );
}