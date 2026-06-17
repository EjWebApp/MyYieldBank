import type { Route } from "./+types/edit-stock-page";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import { Button } from "~/common/components/ui/button";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { stockHoldings } from "../schema";
import { useState } from "react";
import { Calendar } from "~/common/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

export async function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  const [stock] = await db
    .select()
    .from(stockHoldings)
    .where(eq(stockHoldings.holding_id, id))
    .limit(1);

  if (!stock) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    stock: {
      id: stock.holding_id.toString(),
      name: stock.name,
      symbol: stock.symbol,
      purchasePrice: stock.purchase_price,
      purchaseQuantity: stock.quantity ?? 1,
      takeProfitRate: stock.take_profit_rate != null ? parseFloat(stock.take_profit_rate.toString()) : 0,
      stopLossRate: stock.stop_loss_rate != null ? Math.abs(parseFloat(stock.stop_loss_rate.toString())) : 0,
      purchaseDate: stock.purchase_date.toISOString().split("T")[0],
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const purchasePrice = Number(formData.get("purchasePrice"));
  const purchaseQuantity = Number(formData.get("purchaseQuantity"));
  const takeProfitRateStr = String(formData.get("takeProfitRate") ?? "").trim();
  const stopLossRateStr = String(formData.get("stopLossRate") ?? "").trim();
  const purchaseDateStr = String(formData.get("purchaseDate") ?? "");

  if (!name) {
    throw new Response("Invalid name", { status: 400 });
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw new Response("Invalid purchasePrice", { status: 400 });
  }
  if (!Number.isFinite(purchaseQuantity) || purchaseQuantity < 1) {
    throw new Response("Invalid purchaseQuantity", { status: 400 });
  }
  const take_profit_rate = takeProfitRateStr !== "" ? parseFloat(parseFloat(takeProfitRateStr).toFixed(2)) : 0;
  let stop_loss_rate = stopLossRateStr !== "" ? parseFloat(parseFloat(stopLossRateStr).toFixed(2)) : 0;
  if (stop_loss_rate > 0) stop_loss_rate = -Math.abs(stop_loss_rate);
  const purchase_date = new Date(purchaseDateStr);
  if (Number.isNaN(purchase_date.getTime())) {
    throw new Response("Invalid purchaseDate", { status: 400 });
  }

  await db
    .update(stockHoldings)
    .set({
      name,
      purchase_price: Math.trunc(purchasePrice),
      quantity: Math.trunc(purchaseQuantity),
      take_profit_rate: take_profit_rate.toString(),
      stop_loss_rate: stop_loss_rate.toString(),
      purchase_date,
      updated_at: new Date(),
    })
    .where(eq(stockHoldings.holding_id, id));

  return redirect("/stocks");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "종목 수정 | My Yield Bank" },
    { name: "description", content: "종목 정보를 수정하세요" },
  ];
}

export default function EditStockPage() {
  const { stock } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    stock.purchaseDate ? new Date(stock.purchaseDate) : new Date()
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  return (
    <div className="space-y-20">
      <Hero title="종목 수정" subtitle="등록된 종목 정보를 수정합니다." />

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
              defaultValue={stock.name}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="symbol" className="text-sm font-medium">
              종목 코드
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              readOnly
              value={stock.symbol}
              className="w-full px-3 py-2 border rounded-md bg-muted cursor-not-allowed"
            />
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
              defaultValue={stock.purchasePrice}
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
              defaultValue={stock.purchaseQuantity}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="purchaseDate" className="text-sm font-medium">
              구매 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="hidden"
              name="purchaseDate"
              value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
              required
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
                  />
                </div>
              )}
            </div>
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
              defaultValue={stock.takeProfitRate}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground">목표 수익률을 입력하세요 (소수점 둘째 자리까지)</p>
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
              defaultValue={stock.stopLossRate}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground">손실 한도를 입력하세요 (음수 부호 없이 입력하면 내부적으로 음수로 저장됩니다)</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              닫기
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
