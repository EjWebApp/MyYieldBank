import type { Route } from "./+types/new-stock-page";
import { Form, useNavigation, redirect, useLoaderData } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { and, eq } from "drizzle-orm";
import { stockHoldings } from "../schema";
import { getStockPrice } from "~/lib/stock-api";
import { useState } from "react";
import { Calendar } from "~/common/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { getStockCatalog } from "~/lib/stock-catalog";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";

export async function loader({ request }: Route.LoaderArgs) {
  // 서버에서 카탈로그를 로드하여 클라이언트에 전달
  console.log('[NewStockPage] loader: 카탈로그 로드 시작...');
  const catalog = await getStockCatalog();
  console.log('[NewStockPage] loader: 카탈로그 로드 완료, 크기:', Object.keys(catalog).length);
  
  return { catalog };
}

export async function action({ request }: Route.ActionArgs) {
  // 사용자 인증 확인
  const { client, headers } = makeSSRClient(request);
  const profileId = await getLoggedInUserId(client, headers);
  const formData = await request.formData();
  const symbol = (formData.get("symbol") as string).trim();
  const name = (formData.get("name") as string).trim();
  const purchase_price = parseInt(formData.get("purchasePrice") as string);
  const purchase_quantity = Math.max(1, parseInt(formData.get("purchaseQuantity") as string) || 1);
  const purchase_date = new Date(formData.get("purchaseDate") as string);

  // 현재 주식 가격 가져오기
  const stockPrice = await getStockPrice(symbol);
  const current_price = stockPrice.currentPrice;
  const current_date = new Date();

  // 익절률, 손절률 가져오기
  const takeProfitRateStr = formData.get("takeProfitRate") as string;
  const stopLossRateStr = formData.get("stopLossRate") as string;
  const take_profit_rate = takeProfitRateStr && takeProfitRateStr.trim() !== "" 
    ? parseFloat(parseFloat(takeProfitRateStr).toFixed(2))
    : 0;
  let stop_loss_rate = stopLossRateStr && stopLossRateStr.trim() !== "" 
    ? parseFloat(parseFloat(stopLossRateStr).toFixed(2))
    : 0;
  // 사용자에게는 양수로 입력받고 내부적으로 음수로 저장
  if (stop_loss_rate > 0) {
    stop_loss_rate = -Math.abs(stop_loss_rate);
  }

  if (!symbol || !name || Number.isNaN(purchase_price) || purchase_price < 0 || Number.isNaN(purchase_date.getTime())) {
    throw new Response("Invalid stock data", { status: 400 });
  }

  const [existingHolding] = await db
    .select()
    .from(stockHoldings)
    .where(and(eq(stockHoldings.profile_id, profileId), eq(stockHoldings.symbol, symbol)))
    .limit(1);

  if (existingHolding) {
    const existingQuantity = existingHolding.quantity ?? 1;
    const newQuantity = existingQuantity + purchase_quantity;
    const totalCost = existingHolding.purchase_price * existingQuantity + purchase_price * purchase_quantity;
    const averagePrice = Math.trunc(totalCost / newQuantity);
    const profit = current_price - averagePrice;
    const profit_rate = averagePrice !== 0 
      ? parseFloat(((profit / averagePrice) * 100).toFixed(2))
      : 0;

    await db
      .update(stockHoldings)
      .set({
        name,
        purchase_price: averagePrice,
        purchase_date,
        quantity: newQuantity,
        current_price,
        current_date,
        profit_rate: profit_rate.toString(),
        take_profit_rate: take_profit_rate.toString(),
        stop_loss_rate: stop_loss_rate.toString(),
        updated_at: new Date(),
      })
      .where(eq(stockHoldings.holding_id, existingHolding.holding_id));
  } else {
    const profit = current_price - purchase_price;
    const profit_rate = purchase_price !== 0 
      ? parseFloat(((profit / purchase_price) * 100).toFixed(2))
      : 0;

    await db.insert(stockHoldings).values({
      symbol,
      name,
      quantity: purchase_quantity,
      purchase_price,
      purchase_date,
      current_price,
      current_date,
      profit_rate: profit_rate.toString(),
      take_profit_rate: take_profit_rate.toString(),
      stop_loss_rate: stop_loss_rate.toString(),
      profile_id: profileId,
    });
  }

  return redirect("/stocks");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "주식 등록 | My Yield Bank" },
    { name: "description", content: "새로운 주식을 등록하세요" },
  ];
}

export default function NewStockPage() {
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const isSubmitting = navigation.state === "submitting";
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // loader에서 받은 카탈로그를 사용
  const catalog = loaderData.catalog;
  const targetStockName = "KODEX SK하이닉스단일종목레버리지";
  console.log('[NewStockPage] 컴포넌트: 카탈로그 크기:', Object.keys(catalog).length);
  console.log('[NewStockPage] 로드된 종목코드 (target):', targetStockName, catalog[targetStockName]);
  console.log('[NewStockPage] 로드된 카탈로그에 target이 있는지:', Object.keys(catalog).includes(targetStockName));
  //console.log('[NewStockPage',catalog)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputName = e.target.value;
    console.log('[NewStockPage] handleNameChange 호출됨:', inputName);
    setName(inputName);

    // loader에서 받은 카탈로그에서 종목코드 찾기
    const matchedCode = catalog[inputName];
    console.log('[NewStockPage] 입력한 종목명:', inputName);
    console.log('[NewStockPage] 매칭된 코드:', matchedCode);
    
    if (matchedCode) {
      setSymbol(matchedCode);
      console.log('[NewStockPage] 종목코드 설정 완료:', matchedCode);
    } else {
      setSymbol('');
      console.log('[NewStockPage] 매칭되는 코드 없음');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date <= today) {
        setSelectedDate(date);
        setIsCalendarOpen(false);
      }
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setIsCalendarOpen(false);
  };

  return (
    <div className="space-y-20">
      <Hero title="주식 등록" subtitle="새로운 주식을 등록하세요" />
      
      <div className="px-20">
        <Form method="post" className="space-y-6 max-w-2xl mx-auto">

        <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              종목명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="예: 삼성전자"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground">
              주요 종목명을 입력하면 종목코드가 자동으로 입력됩니다.
            </p>
        </div>
        <div className="space-y-2">
            <label htmlFor="symbol" className="text-sm font-medium">
              종목 코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              required
              readOnly
              value={symbol}
              placeholder="종목명 입력 시 자동 입력됩니다"
              className="w-full px-3 py-2 border rounded-md bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              종목명을 입력하면 자동으로 입력됩니다
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="purchasePrice" className="text-sm font-medium">
              구매 가격 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              required
              min="0"
              step="1"
              placeholder="예: 70000"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="purchaseQuantity" className="text-sm font-medium">
              구매 수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="purchaseQuantity"
              name="purchaseQuantity"
              required
              min="1"
              step="1"
              defaultValue={purchaseQuantity}
              value={purchaseQuantity}
              onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="purchaseDate" className="text-sm font-medium">
              구매 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="hidden"
              id="purchaseDate"
              name="purchaseDate"
              required
              value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div 
                  className="flex-1 px-3 py-2 border rounded-md bg-background min-h-[40px] flex items-center cursor-pointer"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  {selectedDate ? (
                    format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span className="text-muted-foreground">날짜를 선택하세요</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="h-[40px] w-[40px]"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
              {isCalendarOpen && (
                <div className="absolute z-10 mt-2 bg-background border rounded-md shadow-lg">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date > new Date()}
                    className="rounded-md"
                    locale={ko}
                    components={{
                      Footer: () => (
                        <div className="p-2 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTodayClick}
                            className="w-full"
                          >
                            오늘
                          </Button>
                        </div>
                      ),
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              달력 아이콘을 클릭하여 날짜를 선택하세요
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="takeProfitRate" className="text-sm font-medium">
              익절률 (%)
            </label>
            <input
              type="number"
              id="takeProfitRate"
              name="takeProfitRate"
              min="0"
              step="0.01"
              placeholder="예: 10.50"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground">
              목표 수익률을 입력하세요 (소수점 둘째 자리까지)
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="stopLossRate" className="text-sm font-medium">
              손절률 (%)
            </label>
            <input
              type="number"
              id="stopLossRate"
              name="stopLossRate"
              min="0"
              step="0.01"
              placeholder="예: 5.00"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground">
              손실 한도를 입력하세요 (소수점 둘째 자리까지, 음수 부호 없이 입력하면 내부적으로 음수로 저장됩니다)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
