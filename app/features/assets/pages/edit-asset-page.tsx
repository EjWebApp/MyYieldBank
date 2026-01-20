import type { Route } from "./+types/edit-asset-page";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import { Button } from "~/common/components/ui/button";
import { Hero } from "~/common/components/hero";
import { db } from "~/db";
import { assets } from "../schema";

export async function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.asset_id, id))
    .limit(1);

  if (!asset) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    asset: {
      id: asset.asset_id.toString(),
      name: asset.name,
      symbol: asset.symbol,
      purchasePrice: asset.purchasePrice,
      purchaseDate: asset.purchaseDate.toISOString().split("T")[0],
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
  const purchaseDateStr = String(formData.get("purchaseDate") ?? "");

  if (!name) {
    throw new Response("Invalid name", { status: 400 });
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw new Response("Invalid purchasePrice", { status: 400 });
  }
  const purchaseDate = new Date(purchaseDateStr);
  if (Number.isNaN(purchaseDate.getTime())) {
    throw new Response("Invalid purchaseDate", { status: 400 });
  }

  await db
    .update(assets)
    .set({
      name,
      purchasePrice: Math.trunc(purchasePrice),
      purchaseDate,
      updatedAt: new Date(),
    })
    .where(eq(assets.asset_id, id));

  return redirect("/assets");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "종목 수정 | My Yield Bank" },
    { name: "description", content: "종목 정보를 수정하세요" },
  ];
}

export default function EditAssetPage() {
  const { asset } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
              defaultValue={asset.name}
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
              value={asset.symbol}
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
              defaultValue={asset.purchasePrice}
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
              defaultValue={asset.purchaseDate}
              className="w-full px-3 py-2 border rounded-md"
            />
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
              취소
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

