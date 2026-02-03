import { useLoaderData, useFetcher } from "react-router";
import { useEffect } from "react";
import { StockCard } from "../../features/stocks/components/stock-card";
import type { Route } from "./+types/home-page";
import { getStockHoldings } from "~/features/stocks/queries";
import { getLoggedInUserId } from "~/features/users/queries";
import { makeSSRClient } from "~/supa-client";
export async function loader({ request }: Route.LoaderArgs) {
  console.log('[HomePage] loader 시작');
  const url = new URL(request.url);
  const stocksOnly = url.searchParams.get('stocks-only') === 'true';
  // stocks-only 모드에서는 인증 체크 없이 주식 데이터만 가져오기
  if (!stocksOnly) {
    console.log('[HomePage] 사용자인증 시작');
    try {
      const{client} = makeSSRClient(request);
      // getLoggedInUserId는 인증되지 않은 경우 redirect를 throw하므로
      // redirect는 catch하지 않고 그대로 전파해야 함
      await getLoggedInUserId(client);
      console.log('[HomePage] 사용자인증 완료');
    } catch (error) {
      console.error('[HomePage] 인증 에러:', error);
      // redirect는 그대로 전파
      throw error;
    }
  } else {
    console.log('[HomePage] 주식 데이터만 갱신 (인증 체크 스킵)');
  }
  try {
    const stocks = await getStockHoldings(request);
    return { stocks };
  } catch (error) {
    console.error('[HomePage] loader 에러:', error);
    return { stocks: [] };
  }
}

export default function HomePage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  // fetcher 데이터가 있으면 사용, 없으면 loader 데이터 사용
  const stocks = (fetcher.data?.stocks ?? loaderData.stocks) || [];

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

  return (
    <div className="space-y-40">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            내 자산
          </h2>
          <p className="text-xl font-light text-foreground">
            보유한 자산의 현재 상태를 확인하세요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks
          .filter((stock: any) => !stock.hidden)
          .map((stock: any) => (
            <StockCard key={stock.id} {...stock} />
          ))}
      </div>
    </div>
  );
}