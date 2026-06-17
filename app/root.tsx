import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import Navigation from "./common/components/navigation";
import { Settings } from "luxon";
import { isInvalidRefreshSessionError, makeSSRClient } from "./supa-client";
import { getAccessToken } from "./lib/stock-api";
import { getStockHoldings } from "./features/stocks/queries";
import { useStockNotifications } from "./lib/use-stock-notifications";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);
  const { data: authData, error: authError } = await client.auth.getUser();

  let user = authData?.user ?? null;
  if (authError && isInvalidRefreshSessionError(authError)) {
    await client.auth.signOut();
    user = null;
  }

  // 서버 시작 시 KIS 토큰을 한 번 가져옴 (하루 1회 제한)
  // ⚠️ 중요: 이 코드는 서버 사이드에서만 실행되며, 모듈 레벨 캐시를 사용합니다
  // 여러 loader에서 호출해도 같은 캐시를 공유하므로 실제로는 한 번만 실행됩니다
  try {
    const appKey = process.env.KIS_APP_KEY || '';
    const appSecret = process.env.KIS_APP_SECRET || '';
    const isProduction = process.env.KIS_PRODUCTION === 'true';
    const baseUrl = isProduction 
      ? 'https://openapi.koreainvestment.com:9443'
      : 'https://openapivts.koreainvestment.com:29443';
    
    if (appKey && appSecret) {
      // 토큰을 가져옴 (캐시되어 있으면 재사용, 없으면 새로 발급)
      await getAccessToken(baseUrl, appKey, appSecret, isProduction);
    }
  } catch (error) {
    // 토큰 발급 실패는 로그만 남기고 앱 실행은 계속
    console.error('[Root Loader] KIS 토큰 초기화 실패 (무시됨):', error);
  }
  // 사용자의 보유 종목을 불러와 총투자금/총자산/수익 계산
  let totals = { invested: 0, totalAssets: 0, totalProfit: 0, profitRate: 0 };
  try {
    const stocks = await getStockHoldings(request);
    const invested = stocks.reduce((sum, s) => sum + ((s.purchasePrice ?? 0) * (s.purchaseQuantity ?? 1)), 0);
    const totalProfit = stocks.reduce((sum, s) => sum + (s.currentProfit ?? 0), 0);
    const totalAssets = invested + totalProfit;
    const profitRate = invested > 0 ? (totalProfit / invested) * 100 : 0;
    totals = { invested, totalAssets, totalProfit, profitRate };
  } catch (err) {
    console.error('[Root Loader] failed to calculate totals:', err);
  }
  
  return data({ user, totals }, { headers });
};
export function Layout({ children }: { children: React.ReactNode }) {
  Settings.defaultLocale = "ko-KR";
  Settings.defaultZone = "Asia/Seoul";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main>{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({loaderData}: Route.ComponentProps) {
  const { pathname } = useLocation();
  const navigation=useNavigation();
  const isLoading=navigation.state==="loading";
  const isLoggedIn=loaderData.user!==null;
  const totals = (loaderData as any).totals ?? null;
  useStockNotifications(loaderData.user?.id ?? null);
  return (
    <div className={pathname.includes("/auth/") ? "" : "px-5 py-28 lg:px-20"}>
      {
        pathname.includes("/auth/")? null:
          ( <Navigation isLoggedIn={isLoggedIn} hasNotification={false} hasMessage={false} totals={totals} />)
      }
      
      <Outlet />
      {pathname.includes("/auth/") ? null : (
        <footer className="mt-24 border-t pt-8 text-sm text-muted-foreground">
          <div className="flex flex-col gap-1">
            <div>사업자정보</div>
            <div>상호: MyYieldBank</div>
            <div>대표자명: 홍길동</div>
            <div>사업자등록번호: 000-00-00000</div>
          </div>
        </footer>
      )}
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
