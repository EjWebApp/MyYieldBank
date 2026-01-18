import type { Route } from "./+types/new-asset-page";
import { Form, useNavigation, redirect } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { assets } from "../schema";
import { getStockPrice } from "~/lib/stock-api";
import { useState } from "react";

// 주요 종목명-종목코드 매핑
const STOCK_CODE_MAP: Record<string, string> = {
  "삼성전자": "005930",
  "SK하이닉스": "000660",
  "NAVER": "035420",
  "카카오": "035720",
  "LG에너지솔루션": "373220",
  "현대차": "005380",
  "기아": "000270",
  "POSCO홀딩스": "005490",
  "셀트리온": "068270",
  "KB금융": "105560",
  "신한지주": "055550",
  "하나금융지주": "086790",
  "LG전자": "066570",
  "삼성물산": "028260",
  "아모레퍼시픽": "090430",
  "한화솔루션": "009830",
  "LG화학": "051910",
  "SK텔레콤": "017670",
  "KT": "030200",
  "LG": "003550",
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const symbol = formData.get("symbol") as string;
  const name = formData.get("name") as string;
  const purchasePrice = parseInt(formData.get("purchasePrice") as string);
  const purchaseDate = new Date(formData.get("purchaseDate") as string);

  // 현재 주식 가격 가져오기
  const stockPrice = await getStockPrice(symbol);
  const currentPrice = stockPrice.currentPrice;
  const currentDate = new Date();
  
  // 수익률 계산
  const profit = currentPrice - purchasePrice;
  const profitRate = purchasePrice !== 0 ? Math.round((profit / purchasePrice) * 100) : 0;

  // 데이터베이스에 저장
  await db.insert(assets).values({
    symbol,
    name,
    purchasePrice,
    purchaseDate,
    currentPrice,
    currentDate,
    profitRate,
  });

  return redirect("/assets");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "주식 등록 | My Yield Bank" },
    { name: "description", content: "새로운 주식을 등록하세요" },
  ];
}

export default function NewAssetPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputName = e.target.value;
    setName(inputName);
    
    // 종목명이 매핑에 있으면 자동으로 종목코드 채우기
    const matchedCode = STOCK_CODE_MAP[inputName];
    if (matchedCode) {
      setSymbol(matchedCode);
    }
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
            <label htmlFor="purchaseDate" className="text-sm font-medium">
              구매 일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
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
